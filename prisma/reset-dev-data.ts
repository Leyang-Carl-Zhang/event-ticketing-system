import "dotenv/config";
import { prisma } from "../lib/db";

/**
 * Deletes all business data but keeps User records.
 * For local developer use only.
 */
async function resetDevData() {
  console.log("Deleting business data (keeping users)...");

  await prisma.checkIn.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.registrationAnswer.deleteMany();
  await prisma.order.deleteMany();
  await prisma.formField.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.eventStaff.deleteMany();
  await prisma.event.deleteMany();

  console.log("Done. Users are unchanged.");
}

resetDevData()
  .then(() => prisma.$disconnect())
  .catch((e: unknown) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
