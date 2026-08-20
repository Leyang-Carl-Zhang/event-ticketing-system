import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { EventPurchaseForm } from "./EventPurchaseForm";

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
    title: event ? `${event.title} | Event` : "Event",
    description: "View event details and purchase tickets",
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketTypes: true,
      formFields: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!event) notFound();

  type TicketTypeRow = { id: string; name: string; price: unknown; quantityLimit: number; soldCount: number };
  type FormFieldRow = { id: string; label: string; type: string; required: boolean };
  const ticketTypesForClient = event.ticketTypes.map((tt: TicketTypeRow) => ({
    id: tt.id,
    name: tt.name,
    price: Number(tt.price),
    quantityLimit: tt.quantityLimit,
    soldCount: tt.soldCount,
  }));

  const isAttendee = session?.role === "ATTENDEE";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {event.title}
      </h1>

      {event.posterUrl && (
        <div className="relative mt-4 aspect-video w-full max-w-xl overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
          <Image
            src={event.posterUrl}
            alt={`${event.title} poster`}
            fill
            className="object-contain"
            sizes="(max-width: 672px) 100vw, 672px"
            unoptimized
          />
        </div>
      )}

      {event.description && (
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{event.description}</p>
      )}

      <dl className="mt-4 space-y-1 text-sm">
        {event.location && (
          <div>
            <dt className="inline font-medium text-zinc-500 dark:text-zinc-400">Location: </dt>
            <dd className="inline text-zinc-900 dark:text-zinc-100">{event.location}</dd>
          </div>
        )}
        <div>
          <dt className="inline font-medium text-zinc-500 dark:text-zinc-400">Start: </dt>
          <dd className="inline text-zinc-900 dark:text-zinc-100">
            {event.startAt.toLocaleString()}
          </dd>
        </div>
        {event.endAt && (
          <div>
            <dt className="inline font-medium text-zinc-500 dark:text-zinc-400">End: </dt>
            <dd className="inline text-zinc-900 dark:text-zinc-100">
              {event.endAt.toLocaleString()}
            </dd>
          </div>
        )}
      </dl>

      <EventPurchaseForm
        id={id}
        ticketTypes={ticketTypesForClient}
        formFields={event.formFields.map((f: FormFieldRow) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          required: f.required,
        }))}
        isAttendee={isAttendee}
      />

      <p className="mt-6">
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to events
        </Link>
      </p>
    </div>
  );
}
