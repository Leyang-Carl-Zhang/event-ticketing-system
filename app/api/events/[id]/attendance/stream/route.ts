import { requireOrganizer } from "@/lib/auth";
import { AuthError } from "@/lib/auth";
import {
  getAttendancePayload,
  subscribe,
  type AttendancePayload,
} from "@/lib/attendance-sse";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireOrganizer();
    const { id: eventId } = await params;

    const event = await prisma.event.findFirst({
      where: { id: eventId, createdById: session.userId },
    });
    if (!event) {
      return new Response("Not found", { status: 404 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const send = (data: AttendancePayload) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            // client may have disconnected
          }
        };

        const unsubscribe = subscribe(eventId, send);

        getAttendancePayload(eventId).then((initial: AttendancePayload) => {
          send(initial);
        }).catch(() => {});

        const keepalive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          } catch {
            clearInterval(keepalive);
          }
        }, 20000);

        const cleanup = () => {
          unsubscribe();
          clearInterval(keepalive);
        };

        request.signal?.addEventListener?.("abort", cleanup);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return new Response(null, { status: 401 });
    }
    throw e;
  }
}
