import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AddStaffForm } from "./AddStaffForm";

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
    title: event ? `Staff - ${event.title}` : "Assign staff",
    description: "Assign check-in staff for this event",
  };
}

export default async function EventStaffPage({ params }: Props) {
  const { id: eventId } = await params;
  const session = await requireOrganizer();

  const event = await prisma.event.findFirst({
    where: { id: eventId, createdById: session.userId },
    include: {
      staff: {
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { assignedAt: "asc" },
      },
    },
  });

  if (!event) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Assign staff
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Add staff by email. They must have a staff account. Assigned staff can check in tickets for this event.
      </p>

      <AddStaffForm eventId={eventId} />

      <h2 className="mt-6 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Assigned staff
      </h2>
      {event.staff.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          No staff assigned yet.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {event.staff.map((s: { id: string; user: { id: string; email: string; name: string | null } }) => (
            <li
              key={s.id}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {s.user.email}
              </span>
              {s.user.name && (
                <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                  {s.user.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/dashboard/events/${eventId}`}
        className="mt-6 inline-block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Back to event
      </Link>
    </div>
  );
}
