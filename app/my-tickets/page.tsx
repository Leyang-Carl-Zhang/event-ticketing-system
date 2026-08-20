import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { requireAttendee } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function TicketQR({ code }: { code: string | null }) {
  if (!code) return <span className="text-zinc-400">—</span>;
  const dataUrl = await QRCode.toDataURL(code, { width: 120, margin: 1 });
  return (
    <Image
      src={dataUrl}
      alt="Ticket QR code"
      width={96}
      height={96}
      unoptimized
      className="h-24 w-24 rounded border border-zinc-200 dark:border-zinc-600"
    />
  );
}

export const metadata = {
  title: "My Tickets",
  description: "View your registered events and e-tickets",
};

export default async function MyTicketsPage() {
  const session = await requireAttendee();
  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      event: { select: { id: true, title: true, startAt: true, posterUrl: true } },
      orderItems: {
        include: {
          ticketType: { select: { name: true } },
          tickets: { select: { id: true, checkInCode: true, status: true, checkedInAt: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        My Tickets
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Your orders and tickets. Show the QR code at check-in.
      </p>

      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          No tickets yet. <Link href="/" className="underline">Browse events</Link> to purchase.
        </p>
      ) : (
        <ul className="mt-6 space-y-6">
          {orders.map((order: {
            id: string;
            createdAt: Date;
            status: string;
            event: { id: string; title: string; startAt: Date; posterUrl: string | null };
            orderItems: Array<{
              id: string;
              quantity: number;
              ticketType: { name: string };
              tickets: Array<{ id: string; checkInCode: string | null; status: string; checkedInAt: Date | null }>;
            }>;
          }) => (
            <li
              key={order.id}
              className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="flex gap-4">
                {order.event.posterUrl && (
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800">
                    <Image
                      src={order.event.posterUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="112px"
                      unoptimized
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/events/${order.event.id}`}
                      className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline"
                    >
                      {order.event.title}
                    </Link>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {order.createdAt.toLocaleDateString()} · {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {order.event.startAt.toLocaleString()}
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {order.orderItems.map((item: { id: string; quantity: number; ticketType: { name: string }; tickets: Array<{ id: string; checkInCode: string | null; status: string; checkedInAt: Date | null }> }) => (
                  <li key={item.id} className="text-zinc-600 dark:text-zinc-300">
                    {item.quantity} × {item.ticketType.name}
                    {item.tickets.length > 0 && (
                      <ul className="mt-1.5 space-y-3 pl-4">
                        {item.tickets.map((ticket: { id: string; checkInCode: string | null; status: string; checkedInAt: Date | null }) => (
                          <li
                            key={ticket.id}
                            className="flex flex-wrap items-center gap-3 text-zinc-500 dark:text-zinc-400"
                          >
                            <TicketQR code={ticket.checkInCode} />
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs">
                                {ticket.checkInCode ?? "—"}
                              </span>
                              {ticket.status === "CHECKED_IN" ? (
                                <>
                                  <span className="inline-flex w-fit rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                                    Checked in
                                  </span>
                                  {ticket.checkedInAt && (
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                      Checked in at: {ticket.checkedInAt.toLocaleString()}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="inline-flex w-fit rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                                  Unused
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
