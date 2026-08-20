"use client";

import { useState, useRef } from "react";
import Image from "next/image";

const ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";

type Props = {
  eventId: string;
  posterUrl: string | null;
};

export function PosterUpload({ eventId, posterUrl: initialPosterUrl }: Props) {
  const [posterUrl, setPosterUrl] = useState<string | null>(initialPosterUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("poster", file);
      const res = await fetch(`/api/events/${eventId}/poster`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setPosterUrl(data.posterUrl ?? `/api/events/${eventId}/poster`);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Event poster</span>
        <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
          {uploading ? "Uploading…" : posterUrl ? "Replace poster" : "Upload poster"}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            disabled={uploading}
            onChange={handleChange}
          />
        </label>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {posterUrl && (
        <div className="relative h-48 w-full max-w-sm overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
          <Image
            src={posterUrl}
            alt="Event poster"
            fill
            className="object-contain"
            sizes="(max-width: 384px) 100vw, 384px"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}
