"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";

type Props = {
  eventId: string;
};

type Result = "idle" | "success" | "invalid" | "already_checked_in" | "error";

export function CheckinForm({ eventId }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result>("idle");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const scanHandledRef = useRef(false);

  const doCheckin = useCallback(async (checkInCode: string) => {
    const trimmed = checkInCode.trim();
    setApiError(null);
    setResult("idle");
    setLoading(true);
    const url = `/api/events/${eventId}/checkin`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInCode: trimmed }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResult("success");
        setCode("");
        router.refresh();
      } else if (res.status === 400) {
        const msg = typeof data.error === "string" ? data.error : "Invalid ticket";
        setApiError(msg);
        if (data.error === "already_checked_in") setResult("already_checked_in");
        else setResult("invalid");
      } else {
        setApiError(typeof data.error === "string" ? data.error : res.statusText || "Request failed");
        setResult("error");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setApiError(msg);
      setResult("error");
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await doCheckin(code);
  }

  useEffect(() => {
    if (!scanning) return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    const codeReader = new BrowserMultiFormatReader();
    let cancelled = false;

    const start = () => {
      codeReader
        .decodeFromVideoDevice(undefined, videoEl, (result, _error, controls) => {
          if (cancelled) return;
          if (controls) controlsRef.current = controls;
          if (result) {
            const text = result.getText();
            if (text && !scanHandledRef.current) {
              scanHandledRef.current = true;
              setCode(text);
              controlsRef.current?.stop();
              controlsRef.current = null;
              setScanning(false);
              doCheckin(text);
            }
          }
        })
        .then((controls) => {
          if (!cancelled) controlsRef.current = controls;
        })
        .catch((err) => {
          if (!cancelled) {
            console.error("Scanner error:", err);
            setScanning(false);
          }
        });
    };

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [scanning, doCheckin]);

  function stopScanning() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }

  function startScanning() {
    scanHandledRef.current = false;
    setScanning(true);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {scanning && (
        <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Point camera at QR code
          </p>
          <div className="relative aspect-square max-w-xs overflow-hidden rounded-md bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={stopScanning}
            className="w-full rounded-md border border-zinc-300 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
          >
            Stop camera
          </button>
        </div>
      )}

      {!scanning && (
        <button
          type="button"
          onClick={startScanning}
          className="w-full rounded-md border border-zinc-300 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
        >
          Scan QR
        </button>
      )}

      <div>
        <label htmlFor="checkInCode" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Ticket code
        </label>
        <input
          id="checkInCode"
          type="text"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste or type check-in code"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Checking in…" : "Check in"}
      </button>

      {result === "success" && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
          Ticket checked in successfully.
        </p>
      )}
      {result === "invalid" && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {apiError ?? "Invalid ticket code."}
        </p>
      )}
      {result === "already_checked_in" && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          {apiError ?? "This ticket has already been checked in."}
        </p>
      )}
      {result === "error" && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {apiError ?? "Something went wrong. Try again."}
        </p>
      )}
    </form>
  );
}
