import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Register - ${id}`,
    description: "Choose ticket type and complete registration",
  };
}

export default async function EventRegisterPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Event registration
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Event ID: {id}. Select a ticket type, fill in details, and complete simulated payment to receive your e-ticket with QR code.
      </p>
      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-500">
        Registration form and simulated payment placeholder. Business logic to be implemented.
      </p>
      <Link
        href={`/events/${id}`}
        className="mt-4 inline-block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Back to event
      </Link>
    </div>
  );
}
