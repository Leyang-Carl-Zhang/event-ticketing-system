import { prisma } from "@/lib/db";

export type AttendancePayload = {
  count: number;
  recent: { ticketId: string; checkedInAt: string }[];
};

export async function getAttendancePayload(eventId: string): Promise<AttendancePayload> {
  const [count, recent] = await Promise.all([
    prisma.checkIn.count({
      where: { ticket: { ticketType: { eventId } } },
    }),
    prisma.checkIn.findMany({
      where: { ticket: { ticketType: { eventId } } },
      orderBy: { checkedInAt: "desc" },
      take: 10,
      select: { ticketId: true, checkedInAt: true },
    }),
  ]);

  type RecentRow = { ticketId: string; checkedInAt: Date };
  return {
    count,
    recent: recent.map((r: RecentRow) => ({
      ticketId: r.ticketId,
      checkedInAt: r.checkedInAt.toISOString(),
    })),
  };
}

const SUBSCRIBERS_KEY = "__attendance_sse_subscribers";
function getSubscribers(): Map<string, Set<(data: AttendancePayload) => void>> {
  const g = globalThis as unknown as { [key: string]: Map<string, Set<(data: AttendancePayload) => void>> };
  if (!g[SUBSCRIBERS_KEY]) {
    g[SUBSCRIBERS_KEY] = new Map();
  }
  return g[SUBSCRIBERS_KEY];
}

export function subscribe(
  eventId: string,
  callback: (data: AttendancePayload) => void
): () => void {
  const subscribers = getSubscribers();
  if (!subscribers.has(eventId)) {
    subscribers.set(eventId, new Set());
  }
  subscribers.get(eventId)!.add(callback);
  return () => {
    subscribers.get(eventId)?.delete(callback);
  };
}

export function notify(eventId: string, data: AttendancePayload): void {
  getSubscribers().get(eventId)?.forEach((cb: (data: AttendancePayload) => void) => {
    try {
      cb(data);
    } catch (e) {
      console.error("SSE notify error:", e);
    }
  });
}
