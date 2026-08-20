import Link from "next/link";
import { requireOrganizer } from "@/lib/auth";
import { prisma } from "@/lib/db";
export const metadata = {
  title: "Dashboard",
  description: "Organizer dashboard overview",
};

export default async function DashboardPage() {
  const session = await requireOrganizer();

  const events = await prisma.event.findMany({
    where: { createdById: session.userId },
    orderBy: { startAt: "desc" },
    select: { id: true, title: true, startAt: true, location: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Your events. Create a new one or open one to view details.
      </p>

      <ul className="mt-6 space-y-3">
        {events.length === 0 ? (
          <li className="text-sm text-zinc-500 dark:text-zinc-500">
            No events yet. Create your first event above.
          </li>
        ) : (
          events.map((event: { id: string; title: string; startAt: Date; location: string | null }) => (
            <li key={event.id}>
              <Link
                href={`/dashboard/events/${event.id}`}
                className="block rounded-md border border-zinc-200 px-4 py-3 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {event.title}
                </span>
                <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {event.startAt.toLocaleDateString()} {event.location ? ` · ${event.location}` : ""}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
