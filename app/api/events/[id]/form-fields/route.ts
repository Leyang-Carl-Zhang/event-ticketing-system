import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { AuthError } from "@/lib/auth";
const createBodySchema = z.object({
  label: z.string().min(1, "Label is required").max(200),
  type: z.enum(["TEXT", "EMAIL", "PHONE", "NUMBER"]),
  required: z.boolean().default(false),
});

/** GET: List form fields for an event (public, for purchase form). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const formFields = await prisma.formField.findMany({
    where: { eventId: id },
    orderBy: { sortOrder: "asc" },
    select: { id: true, label: true, type: true, required: true },
  });
  return NextResponse.json(formFields);
}

/** POST: Create a form field (organizer only). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireOrganizer();
    const { id } = await params;

    const event = await prisma.event.findFirst({
      where: { id, createdById: session.userId },
      select: { id: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { label, type, required } = parsed.data;

    const agg = await prisma.formField.aggregate({
      where: { eventId: id },
      _max: { sortOrder: true },
    });
    const maxOrder = agg._max.sortOrder ?? -1;

    const formField = await prisma.formField.create({
      data: {
        eventId: id,
        label,
        type,
        required,
        sortOrder: maxOrder + 1,
      },
      select: { id: true, label: true, type: true, required: true },
    });
    return NextResponse.json(formField, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
