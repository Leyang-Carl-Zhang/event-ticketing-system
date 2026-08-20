"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TicketType = {
  id: string;
  name: string;
  price: number;
  quantityLimit: number;
  soldCount: number;
};

type Props = {
  id: string;
  ticketTypes: TicketType[];
};

export function TicketTypesSection({ id, ticketTypes: initialTicketTypes }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantityLimit, setQuantityLimit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: parseFloat(price) || 0,
          quantityLimit: parseInt(quantityLimit, 10) || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "object" ? JSON.stringify(data.error) : data.error ?? "Failed to add");
        return;
      }
      setName("");
      setPrice("");
      setQuantityLimit("");
      router.refresh();
    } catch {
      setError("Failed to add ticket type");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(ticketTypeId: string) {
    setDeletingId(ticketTypeId);
    try {
      const res = await fetch(`/api/events/${id}/ticket-types/${ticketTypeId}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
        Ticket types
      </h2>

      {initialTicketTypes.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          No ticket types yet. Add one below.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {initialTicketTypes.map((tt) => (
            <li
              key={tt.id}
              className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-700"
            >
              <span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{tt.name}</span>
                <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                  ${tt.price.toFixed(2)} · limit {tt.quantityLimit}
                  {tt.soldCount > 0 && ` · sold ${tt.soldCount}`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleDelete(tt.id)}
                disabled={deletingId === tt.id}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
              >
                {deletingId === tt.id ? "…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        {error && (
          <p className="w-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="tt-name" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Name
          </label>
          <input
            id="tt-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. General Admission"
            className="mt-1 w-40 rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="tt-price" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Price ($)
          </label>
          <input
            id="tt-price"
            type="number"
            min="0"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="tt-qty" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Quantity limit
          </label>
          <input
            id="tt-qty"
            type="number"
            min="1"
            required
            value={quantityLimit}
            onChange={(e) => setQuantityLimit(e.target.value)}
            className="mt-1 w-20 rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Adding…" : "Add"}
        </button>
      </form>
    </div>
  );
}
