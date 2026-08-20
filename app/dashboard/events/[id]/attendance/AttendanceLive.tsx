"use client";

import { useEffect, useState } from "react";

type Payload = {
  count: number;
  recent: { ticketId: string; checkedInAt: string }[];
};

type Props = {
  eventId: string;
  initial: Payload;
};

export function AttendanceLive({ eventId, initial }: Props) {
  const [data, setData] = useState<Payload>(initial);

  useEffect(() => {
    const url = `/api/events/${eventId}/attendance/stream`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const next = JSON.parse(e.data) as Payload;
        if (next && typeof next.count === "number" && Array.isArray(next.recent)) {
          setData(next);
        }
      } catch {
        // ignore invalid messages
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [eventId]);

  const formatTime = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Checked-in count: {data.count}
        </p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Recent check-ins
        </h2>
        {data.recent.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            No check-ins yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            {data.recent.map((r) => (
              <li
                key={r.ticketId}
                className="rounded border border-zinc-200 px-3 py-2 dark:border-zinc-700"
              >
                {r.ticketId} · {formatTime(r.checkedInAt)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
