import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { AuthError } from "@/lib/auth";
import { uploadPoster, getPoster, isAllowedPosterType } from "@/lib/r2";

const POSTER_KEY_PREFIX = "posters/";
const MAX_POSTER_SIZE_BYTES = 5 * 1024 * 1024;

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await requireOrganizer();
    const { id: eventId } = await params;

    const event = await prisma.event.findFirst({
      where: { id: eventId, createdById: session.userId },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("poster");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No poster file" }, { status: 400 });
    }

    if (!isAllowedPosterType(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, JPEG, WebP are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_POSTER_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Poster must be 5 MB or smaller" },
        { status: 413 }
      );
    }

    const key = `${POSTER_KEY_PREFIX}${eventId}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || "image/jpeg";

    await uploadPoster(key, buffer, contentType);

    const posterUrl = `/api/events/${eventId}/poster`;
    await prisma.event.update({
      where: { id: eventId },
      data: { posterFileKey: key, posterUrl },
    });

    return NextResponse.json({ posterUrl });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    const err = e as { name?: string; message?: string; $metadata?: { httpStatusCode?: number; requestId?: string } };
    console.error("Poster upload error:", {
      name: err.name,
      message: err.message,
      ...(err.$metadata && { statusCode: err.$metadata.httpStatusCode, requestId: err.$metadata.requestId }),
    });
    return NextResponse.json(
      { error: "Failed to upload poster" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { posterFileKey: true },
    });
    if (!event?.posterFileKey) {
      return new NextResponse(null, { status: 404 });
    }

    const result = await getPoster(event.posterFileKey);
    if (!result) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(result.body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": result.contentType,
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
