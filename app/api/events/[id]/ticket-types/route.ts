import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { AuthError } from "@/lib/auth";

const createBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0),
  quantityLimit: z.number().int().min(1, "Quantity must be at least 1"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireOrganizer();
    const { id } = await params;

    const event = await prisma.event.findFirst({
      where: { id, createdById: session.userId },
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
    const { name, price, quantityLimit } = parsed.data;

    const ticketType = await prisma.ticketType.create({
      data: {
        eventId: id,
        name,
        price,
        quantityLimit,
      },
    });

    return NextResponse.json(
      {
        ticketType: {
          id: ticketType.id,
          name: ticketType.name,
          price: Number(ticketType.price),
          quantityLimit: ticketType.quantityLimit,
          soldCount: ticketType.soldCount,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error("Create ticket type error:", e);
    return NextResponse.json(
      { error: "Failed to create ticket type" },
      { status: 500 }
    );
  }
}
