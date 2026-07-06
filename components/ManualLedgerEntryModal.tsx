"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ManualLedgerEntryModalProps {
  contactId: string;
  contactName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ManualLedgerEntryModal({
  contactId,
  contactName,
  onClose,
  onSuccess,
}: ManualLedgerEntryModalProps) {
  const [kind, setKind] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(kind === "credit" ? "/api/charges" : "/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          amount: amountNum,
          note: note.trim() || null,
          createdAt: new Date(date).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save entry");
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
      <div className="card relative z-10 max-h-[90vh] w-full max-w-sm overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Add Ledger Entry</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground/50 hover:bg-primary-light hover:text-primary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-1 text-sm text-foreground/60">{contactName}</p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setKind("credit")}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                kind === "credit" ? "bg-primary text-white" : "bg-black/5 text-foreground/60"
              }`}
            >
              Credit (Billed)
            </button>
            <button
              type="button"
              onClick={() => setKind("debit")}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                kind === "debit" ? "bg-primary text-white" : "bg-black/5 text-foreground/60"
              }`}
            >
              Debit (Paid)
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/60">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/60">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/60">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={kind === "credit" ? "e.g. Delivery charge" : "e.g. Advance payment"}
              className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

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
              {submitting ? "Saving..." : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
