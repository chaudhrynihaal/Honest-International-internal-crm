"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface EntryNoteModalProps {
  kind: "entries" | "payments" | "charges";
  id: string;
  amount: number;
  label: string;
  note: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EntryNoteModal({ kind, id, amount, label, note, onClose, onSuccess }: EntryNoteModalProps) {
  const [value, setValue] = useState(note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setSubmitting(true);
    try {
      const res = await fetch(`/api/${kind}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: value.trim() || null,
          ...(kind !== "entries" ? { amount } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save note");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="card relative z-10 w-full max-w-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Note</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground/50 hover:bg-primary-light hover:text-primary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-1 text-sm text-foreground/60">{label}</p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Add a note about this entry..."
            className="w-full resize-none rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/60 hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
