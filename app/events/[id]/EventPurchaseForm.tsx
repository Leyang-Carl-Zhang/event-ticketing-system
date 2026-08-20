"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TicketType = {
  id: string;
  name: string;
  price: number;
  quantityLimit: number;
  soldCount: number;
};

type FormFieldItem = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

type Props = {
  id: string;
  ticketTypes: TicketType[];
  formFields: FormFieldItem[];
  isAttendee: boolean;
};

export function EventPurchaseForm({ id, ticketTypes, formFields, isAttendee }: Props) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(ticketTypes.map((t) => [t.id, 0]))
  );
  const [registrationAnswers, setRegistrationAnswers] = useState<Record<string, string>>(
    Object.fromEntries(formFields.map((f) => [f.id, ""]))
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0);
  const requiredFilled = formFields
    .filter((f) => f.required)
    .every((f) => (registrationAnswers[f.id] ?? "").trim() !== "");
  const canBuy = totalQty > 0 && requiredFilled && isAttendee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canBuy) return;
    setError(null);
    setLoading(true);
    try {
      const items = Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

      const answers: Record<string, string> = {};
      formFields.forEach((f) => {
        const v = (registrationAnswers[f.id] ?? "").trim();
        if (v) answers[f.id] = v;
      });
      const res = await fetch(`/api/events/${id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, registrationAnswers: answers }),
      });
      const data = await res.json();

      if (res.status === 401) {
        router.push(`/login?from=/events/${id}`);
        return;
      }
      if (!res.ok) {
        setError(typeof data.error === "object" ? JSON.stringify(data.error) : data.error ?? "Purchase failed");
        return;
      }
      router.push("/my-tickets");
      router.refresh();
    } catch {
      setError("Purchase failed");
    } finally {
      setLoading(false);
    }
  }

  if (ticketTypes.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        No ticket types available for this event.
      </p>
    );
  }

  if (!isAttendee) {
    return (
      <div className="mt-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Log in as an attendee to purchase tickets.
        </p>
        <Link
          href={`/login?from=/events/${id}`}
          className="mt-2 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {formFields.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Registration</h3>
          {formFields.map((f) => (
            <div key={f.id}>
              <label htmlFor={`reg-${f.id}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {f.label}
                {f.required && <span className="text-red-500"> *</span>}
              </label>
              <input
                id={`reg-${f.id}`}
                type={f.type === "NUMBER" ? "number" : f.type === "EMAIL" ? "email" : f.type === "PHONE" ? "tel" : "text"}
                value={registrationAnswers[f.id] ?? ""}
                onChange={(e) =>
                  setRegistrationAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))
                }
                required={f.required}
                className="mt-1 w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          ))}
        </div>
      )}
      <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Tickets</h3>
      {ticketTypes.map((tt) => {
        const available = tt.quantityLimit - tt.soldCount;
        return (
          <div
            key={tt.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-700"
          >
            <div>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{tt.name}</span>
              <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                ${tt.price.toFixed(2)} · {available} left
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor={`qty-${tt.id}`} className="sr-only">Quantity</label>
              <input
                id={`qty-${tt.id}`}
                type="number"
                min={0}
                max={available}
                value={quantities[tt.id] ?? 0}
                onChange={(e) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [tt.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                  }))
                }
                className="w-16 rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        );
      })}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!canBuy || loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Processing…" : totalQty > 0 ? `Buy ${totalQty} ticket${totalQty === 1 ? "" : "s"}` : "Select quantity"}
      </button>
    </form>
  );
}
