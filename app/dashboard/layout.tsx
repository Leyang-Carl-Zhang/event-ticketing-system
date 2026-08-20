import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-6 flex gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Overview
        </Link>
        <Link
          href="/dashboard/events/new"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          New event
        </Link>
      </nav>
      {children}
    </div>
  );
}
