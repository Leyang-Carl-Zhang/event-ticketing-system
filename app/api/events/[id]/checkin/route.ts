import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { AuthError } from "@/lib/auth";
import { getAttendancePayload, notify } from "@/lib/attendance-sse";

const bodySchema = z.object({
  checkInCode: z.string().min(1, "Code is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaff();
    const { id: eventId } = await params;

    const assigned = await prisma.eventStaff.findUnique({
      where: { eventId_userId: { eventId, userId: session.userId } },
    });
    if (!assigned) {
      return NextResponse.json(
        { error: "Not assigned to this event" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }
    const { checkInCode } = parsed.data;

    const ticket = await prisma.ticket.findUnique({
      where: { checkInCode },
      include: { ticketType: { select: { eventId: true } }, checkIn: true },
    });

    if (!ticket || ticket.ticketType.eventId !== eventId) {
      return NextResponse.json(
        { error: "invalid" },
        { status: 400 }
      );
    }

    if (ticket.status === "CHECKED_IN" || ticket.checkIn) {
      return NextResponse.json(
        { error: "already_checked_in" },
        { status: 400 }
      );
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.checkIn.create({
        data: {
          ticketId: ticket.id,
          checkedInById: session.userId,
        },
      }),
      prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "CHECKED_IN",
          checkedInAt: now,
          checkedInById: session.userId,
        },
      }),
    ]);

    const payload = await getAttendancePayload(eventId);
    notify(eventId, payload);

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error("Check-in error:", e);
    return NextResponse.json(
      { error: "Check-in failed" },
      { status: 500 }
    );
  }
}
