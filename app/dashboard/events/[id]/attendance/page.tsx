import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAttendancePayload } from "@/lib/attendance-sse";
import { AttendanceLive } from "./AttendanceLive";

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
    title: event ? `Attendance - ${event.title}` : "Attendance",
    description: "Real-time event check-in overview",
  };
}

export default async function EventAttendancePage({ params }: Props) {
  const { id: eventId } = await params;
  const session = await requireOrganizer();

  const event = await prisma.event.findFirst({
    where: { id: eventId, createdById: session.userId },
    select: { title: true },
  });
  if (!event) notFound();

  const initial = await getAttendancePayload(eventId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Attendance
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {event.title}. Live updates when staff check in tickets.
      </p>

      <AttendanceLive eventId={eventId} initial={initial} />

      <Link
        href={`/dashboard/events/${eventId}`}
        className="mt-6 inline-block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Back to event
      </Link>
    </div>
  );
}
