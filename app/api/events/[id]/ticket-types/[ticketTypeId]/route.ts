import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { AuthError } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; ticketTypeId: string }> }
) {
  try {
    const session = await requireOrganizer();
    const { id, ticketTypeId } = await params;

    const ticketType = await prisma.ticketType.findFirst({
      where: { id: ticketTypeId, eventId: id },
      include: { event: true },
    });
    if (!ticketType || ticketType.event.createdById !== session.userId) {
      return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    }

    await prisma.ticketType.delete({
      where: { id: ticketTypeId },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error("Delete ticket type error:", e);
    return NextResponse.json(
      { error: "Failed to delete ticket type" },
      { status: 500 }
    );
  }
}
