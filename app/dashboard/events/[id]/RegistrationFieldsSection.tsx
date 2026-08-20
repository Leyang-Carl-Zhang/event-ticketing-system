"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FIELD_TYPES = ["TEXT", "EMAIL", "PHONE", "NUMBER"] as const;

type FormFieldItem = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

type Props = {
  eventId: string;
  formFields: FormFieldItem[];
};

export function RegistrationFieldsSection({ eventId, formFields: initialFields }: Props) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<typeof FIELD_TYPES[number]>("TEXT");
  const [required, setRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/form-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), type, required }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "object" ? JSON.stringify(data.error) : data.error ?? "Failed to add");
        return;
      }
      setLabel("");
      setRequired(false);
      router.refresh();
    } catch {
      setError("Failed to add field");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
        Registration form fields
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Custom fields shown to attendees when they purchase tickets.
      </p>

      {initialFields.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          No custom fields yet. Add one below.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {initialFields.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-700"
            >
              <span className="text-sm text-zinc-900 dark:text-zinc-100">{f.label}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {f.type} {f.required && "· Required"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
        <div>
          <label htmlFor="reg-label" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Label
          </label>
          <input
            id="reg-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Phone number"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="reg-type" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Type
          </label>
          <select
            id="reg-type"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="reg-required"
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-600"
          />
          <label htmlFor="reg-required" className="text-sm text-zinc-700 dark:text-zinc-300">
            Required
          </label>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={!label.trim() || loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Adding…" : "Add field"}
        </button>
      </form>
    </div>
  );
}
