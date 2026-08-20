import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { requireAttendee } from "@/lib/auth";
import { AuthError } from "@/lib/auth";

const bodySchema = z.object({
  items: z.array(
    z.object({
      ticketTypeId: z.string(),
      quantity: z.number().int().min(1),
    })
  ).min(1, "At least one item required"),
  registrationAnswers: z.record(z.string(), z.string()).optional().default({}),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAttendee();
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { ticketTypes: true, formFields: { orderBy: { sortOrder: "asc" } } },
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
    const { items } = parsed.data;
    const registrationAnswers: Record<string, string> = parsed.data.registrationAnswers ?? {};

    type FormFieldRow = { id: string; required: boolean };
    type FormFieldFindRow = { id: string; label?: string | null };
    const requiredFieldIds = new Set<string>(
      event.formFields.filter((f: FormFieldRow) => f.required).map((f: FormFieldRow) => f.id)
    );
    const eventFieldIds = new Set<string>(event.formFields.map((f: FormFieldRow) => f.id));
    for (const fieldId of Object.keys(registrationAnswers) as string[]) {
      if (!eventFieldIds.has(fieldId)) {
        return NextResponse.json(
          { error: `Unknown form field: ${fieldId}` },
          { status: 400 }
        );
      }
    }
    for (const fieldId of requiredFieldIds) {
      const value = (registrationAnswers[fieldId] ?? "").trim();
      if (!value) {
        const field = event.formFields.find((f: FormFieldFindRow) => f.id === fieldId);
        return NextResponse.json(
          { error: `Required field "${field?.label ?? fieldId}" is missing` },
          { status: 400 }
        );
      }
    }

    type TicketTypeRow = {
      id: string;
      name: string;
      quantityLimit: number;
      soldCount: number;
      price: NonNullable<Awaited<ReturnType<typeof prisma.ticketType.findFirst>>>["price"];
    };
    const typeIds = new Set(event.ticketTypes.map((t: TicketTypeRow) => t.id));
    for (const item of items) {
      if (!typeIds.has(item.ticketTypeId)) {
        return NextResponse.json(
          { error: `Ticket type ${item.ticketTypeId} not found for this event` },
          { status: 400 }
        );
      }
    }

    for (const item of items) {
      const tt = event.ticketTypes.find((t: TicketTypeRow) => t.id === item.ticketTypeId)!;
      const available = tt.quantityLimit - tt.soldCount;
      if (item.quantity > available) {
        return NextResponse.json(
          { error: `Not enough tickets for "${tt.name}". Available: ${available}` },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const order = await prisma.order.create({
      data: {
        userId: session.userId,
        eventId: id,
        status: "PAID",
        paidAt: now,
      },
    });

    const ticketsWithTokens: { id: string; token: string; checkInCode: string | null }[] = [];

    for (const item of items) {
      const ticketType = event.ticketTypes.find((t: TicketTypeRow) => t.id === item.ticketTypeId)!;
      const unitPrice = ticketType.price;

      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPrice,
        },
      });

      for (let i = 0; i < item.quantity; i++) {
        const token = randomUUID();
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const checkInCode = randomUUID();
        const ticket = await prisma.ticket.create({
          data: {
            orderItemId: orderItem.id,
            ticketTypeId: item.ticketTypeId,
            tokenHash,
            checkInCode,
            status: "VALID",
          },
        });
        ticketsWithTokens.push({ id: ticket.id, token, checkInCode: ticket.checkInCode });
      }

      await prisma.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { soldCount: { increment: item.quantity } },
      });
    }

    for (const [formFieldId, value] of Object.entries(registrationAnswers)) {
      const trimmed = value.trim();
      if (!trimmed || !eventFieldIds.has(formFieldId)) continue;
      await prisma.registrationAnswer.create({
        data: {
          orderId: order.id,
          formFieldId,
          value: trimmed,
        },
      });
    }

    return NextResponse.json(
      {
        order: { id: order.id, eventId: order.eventId, status: order.status },
        tickets: ticketsWithTokens,
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error("Create order error:", e);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
