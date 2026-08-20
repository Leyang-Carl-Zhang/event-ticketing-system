import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TicketTypesSection } from "./TicketTypesSection";
import { PosterUpload } from "./PosterUpload";
import { RegistrationFieldsSection } from "./RegistrationFieldsSection";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const session = await requireOrganizer();
  const event = await prisma.event.findFirst({
    where: { id, createdById: session.userId },
    select: { title: true },
  });
  return {
    title: event ? `${event.title} | Event` : "Event",
    description: "Event details",
  };
}

export default async function DashboardEventPage({ params }: Props) {
  const { id } = await params;
  const session = await requireOrganizer();

  const event = await prisma.event.findFirst({
    where: { id, createdById: session.userId },
    include: { ticketTypes: true, formFields: { orderBy: { sortOrder: "asc" } } },
  });

  if (!event) notFound();

  type TicketTypeRow = {
    id: string;
    name: string;
    price: unknown;
    quantityLimit: number;
    soldCount: number;
  };
  type FormFieldRow = { id: string; label: string; type: string; required: boolean };
  const ticketTypesForClient = event.ticketTypes.map((tt: TicketTypeRow) => ({
    id: tt.id,
    name: tt.name,
    price: Number(tt.price),
    quantityLimit: tt.quantityLimit,
    soldCount: tt.soldCount,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {event.title}
      </h1>

      <div className="mt-6">
        <PosterUpload eventId={id} posterUrl={event.posterUrl} />
      </div>

      <dl className="mt-6 space-y-3">
        {event.description && (
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Description</dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{event.description}</dd>
          </div>
        )}
        {event.location && (
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Location</dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{event.location}</dd>
          </div>
        )}
        <div>
          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Start</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {event.startAt.toLocaleString()}
          </dd>
        </div>
        {event.endAt && (
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">End</dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
              {event.endAt.toLocaleString()}
            </dd>
          </div>
        )}
      </dl>

      <TicketTypesSection id={id} ticketTypes={ticketTypesForClient} />

      <RegistrationFieldsSection
        eventId={id}
        formFields={event.formFields.map((f: FormFieldRow) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          required: f.required,
        }))}
      />

      <div className="mt-8 flex gap-4">
        <Link
          href={`/dashboard/events/${id}/staff`}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Assign staff →
        </Link>
        <Link
          href={`/dashboard/events/${id}/attendance`}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Attendance →
        </Link>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
