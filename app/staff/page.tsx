import Link from "next/link";
import Image from "next/image";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Staff",
  description: "Select an event to check in attendees",
};

export default async function StaffPage() {
  const session = await requireStaff();

  const assignments = await prisma.eventStaff.findMany({
    where: { userId: session.userId },
    include: {
      event: {
        select: { id: true, title: true, location: true, startAt: true, posterUrl: true },
      },
    },
    orderBy: { event: { startAt: "asc" } },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Staff
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Choose an event you are assigned to and open the check-in page.
      </p>

      {assignments.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-500">
          You are not assigned to any events yet. Ask an organizer to add you by email.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {assignments.map((a: { id: string; event: { id: string; title: string; location: string | null; startAt: Date; posterUrl: string | null } }) => (
            <li key={a.id}>
              <Link
                href={`/staff/checkin/${a.event.id}`}
                className="flex gap-4 rounded-md border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
              >
                {a.event.posterUrl && (
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800">
                    <Image
                      src={a.event.posterUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="112px"
                      unoptimized
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {a.event.title}
                  </span>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {a.event.startAt.toLocaleString()}
                    {a.event.location && ` · ${a.event.location}`}
                  </p>
                  <span className="mt-2 inline-block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Open check-in →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
