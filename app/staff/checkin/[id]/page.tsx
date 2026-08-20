import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CheckinForm } from "./CheckinForm";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: event ? `Check-in - ${event.title}` : "Check-in",
    description: "Check in attendees by ticket code",
  };
}

export default async function StaffCheckinPage({ params }: Props) {
  const { id: eventId } = await params;
  const session = await getSession();

  if (!session || session.role !== "STAFF") {
    notFound();
  }

  const assigned = await prisma.eventStaff.findUnique({
    where: { eventId_userId: { eventId, userId: session.userId } },
    include: { event: { select: { title: true } } },
  });

  if (!assigned) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Check-in
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {assigned.event.title}
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
        Enter the ticket code from the attendee&apos;s QR or ticket.
      </p>

      <CheckinForm eventId={eventId} />

      <Link
        href="/staff"
        className="mt-6 inline-block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Back to events
      </Link>
    </div>
  );
}
