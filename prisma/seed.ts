import "dotenv/config";
import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";
const USERS = [
  { email: "organizer1@example.test", role: "ORGANIZER" as const },
  { email: "organizer2@example.test", role: "ORGANIZER" as const },
  { email: "staff1@example.test", role: "STAFF" as const },
  { email: "staff2@example.test", role: "STAFF" as const },
  { email: "attendee1@example.test", role: "ATTENDEE" as const },
  { email: "attendee2@example.test", role: "ATTENDEE" as const },
];

async function seed() {
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error("SEED_PASSWORD must be set and contain at least 12 characters");
  }
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  for (const { email, role } of USERS) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`User ${email} already exists, skipping.`);
      continue;
    }
    await prisma.user.create({
      data: { email, passwordHash, role },
    });
    console.log(`Created user: ${email} (${role}).`);
  }
}

seed()
  .then(() => prisma.$disconnect())
  .catch((e: unknown) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
