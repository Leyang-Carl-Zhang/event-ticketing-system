import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Home",
  description: "Browse and register for events",
};

export default async function HomePage() {
  const events = await prisma.event.findMany({
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      startAt: true,
      posterUrl: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Events
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Browse upcoming events and click through to view details and register.
      </p>

      {events.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-500">
          No events yet. Check back later.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {events.map((event: { id: string; title: string; description: string | null; location: string | null; startAt: Date; posterUrl: string | null }) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex gap-4 rounded-md border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
              >
                {event.posterUrl && (
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800">
                    <Image
                      src={event.posterUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="112px"
                      unoptimized
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
                    {event.title}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {event.startAt.toLocaleString()}
                    {event.location && ` · ${event.location}`}
                  </p>
                  {event.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {event.description}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
