import "dotenv/config";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db";

async function backfill() {
  const tickets = await prisma.ticket.findMany({
    where: { checkInCode: null },
    select: { id: true },
  });

  if (tickets.length === 0) {
    console.log("No tickets with missing checkInCode.");
    return;
  }

  for (const ticket of tickets) {
    const checkInCode = randomUUID();
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { checkInCode },
    });
    console.log(`Updated ticket ${ticket.id} with checkInCode.`);
  }

  console.log(`Backfilled ${tickets.length} ticket(s).`);
}

backfill()
  .then(() => prisma.$disconnect())
  .catch((e: unknown) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
