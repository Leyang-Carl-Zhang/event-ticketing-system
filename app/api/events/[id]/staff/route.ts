import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { AuthError } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email("Invalid email"),
});

export async function POST(
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
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 400 }
      );
    }
    if (user.role !== "STAFF") {
      return NextResponse.json(
        { error: "User is not a staff member" },
        { status: 400 }
      );
    }

    const existing = await prisma.eventStaff.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Staff already assigned to this event" },
        { status: 400 }
      );
    }

    await prisma.eventStaff.create({
      data: { eventId, userId: user.id },
    });

    const staff = await prisma.eventStaff.findMany({
      where: { eventId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { assignedAt: "asc" },
    });

    type StaffRow = { id: string; assignedAt: Date; user: { id: string; email: string; name: string | null } };
    return NextResponse.json({
      staff: staff.map((s: StaffRow) => ({
        id: s.id,
        email: s.user.email,
        name: s.user.name,
        assignedAt: s.assignedAt,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error("Assign staff error:", e);
    return NextResponse.json(
      { error: "Failed to assign staff" },
      { status: 500 }
    );
  }
}
