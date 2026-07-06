"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatPKR } from "@/lib/currency";

interface PaymentModalProps {
  contactId: string;
  contactName: string;
  balanceDue: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ contactId, contactName, balanceDue, onClose, onSuccess }: PaymentModalProps) {
  const [mode, setMode] = useState<"choose" | "partial">("choose");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitPayment(paidAmount: number) {
    setError(null);

    if (!paidAmount || paidAmount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (paidAmount > balanceDue + 0.01) {
      setError(`Amount can't exceed the balance due (${formatPKR(balanceDue)})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, amount: paidAmount }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to record payment");
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
          <h2 className="text-lg font-semibold text-foreground">Record Payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground/50 hover:bg-primary-light hover:text-primary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-1 text-sm text-foreground/60">
          {contactName} &middot; Balance due: <span className="font-medium">{formatPKR(balanceDue)}</span>
        </p>

        {mode === "choose" ? (
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              disabled={submitting || balanceDue <= 0}
              onClick={() => submitPayment(balanceDue)}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Saving..." : `Paid Fully (${formatPKR(balanceDue)})`}
            </button>
            <button
              type="button"
              disabled={submitting || balanceDue <= 0}
              onClick={() => setMode("partial")}
              className="rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-black/5 disabled:opacity-50"
            >
              Paid Partially
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitPayment(Number(amount));
            }}
            className="mt-5 flex flex-col gap-4"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">Amount Paid</label>
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

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/60 hover:bg-black/5"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        )}

        {mode === "choose" && error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
