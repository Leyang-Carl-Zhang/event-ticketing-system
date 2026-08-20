import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { AuthError } from "@/lib/auth";

const createBodySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireOrganizer();
    const body = await request.json();
    const parsed = createBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { title, description, location, startAt, endAt } = parsed.data;

    const event = await prisma.event.create({
      data: {
        title,
        description: description ?? null,
        location: location ?? null,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        createdById: session.userId,
      },
    });

    return NextResponse.json(
      { event: { id: event.id, title: event.title, startAt: event.startAt } },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error("Create event error:", e);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
