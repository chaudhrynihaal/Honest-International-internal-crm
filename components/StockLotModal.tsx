"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatPKR } from "@/lib/currency";
import type { FactoryStockLot } from "@/lib/types";

interface StockLotModalProps {
  onClose: () => void;
  onSuccess: () => void;
  existingYarnTypes: string[];
  lot?: FactoryStockLot;
}

function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function StockLotModal({ onClose, onSuccess, existingYarnTypes, lot }: StockLotModalProps) {
  const isEdit = !!lot;
  const [yarnType, setYarnType] = useState(lot?.yarnType ?? "");
  const [bags, setBags] = useState(lot ? String(lot.bags) : "");
  const [rate, setRate] = useState(lot ? String(lot.rate) : "");
  const [boughtAt, setBoughtAt] = useState(() => toDateInput(lot ? new Date(lot.boughtAt) : new Date()));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const bagsNumLive = Number(bags);
  const rateNumLive = Number(rate);
  const totalBill = bagsNumLive > 0 && rateNumLive > 0 ? bagsNumLive * rateNumLive : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!yarnType.trim()) {
      setError("Yarn type is required");
      return;
    }
    const bagsNum = Number(bags);
    if (bagsNum < 0 || (!isEdit && bagsNum <= 0)) {
      setError("Bags must be 0 or greater");
      return;
    }
    const rateNum = Number(rate);
    if (!rateNum || rateNum <= 0) {
      setError("Rate must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/factory-stock/${lot!.id}` : "/api/factory-stock", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yarnType: yarnType.trim(),
          bags: bagsNum,
          rate: rateNum,
          boughtAt: new Date(boughtAt).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to ${isEdit ? "update" : "add"} stock`);
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
      <div className="card relative z-10 w-full max-w-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? "Edit Factory Stock" : "Add Factory Stock"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-foreground/50 hover:bg-primary-light hover:text-primary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/60">Yarn Type</label>
            <input
              type="text"
              list="yarn-type-options"
              value={yarnType}
              onChange={(e) => setYarnType(e.target.value)}
              placeholder="e.g. Cotton 30s"
              className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <datalist id="yarn-type-options">
              {existingYarnTypes.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">No. of Bags</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={bags}
                onChange={(e) => setBags(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">Rate (per bag)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {totalBill !== null && (
            <p className="text-sm font-semibold text-primary">Total Bill: {formatPKR(totalBill)}</p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/60">Bought Date</label>
            <input
              type="date"
              value={boughtAt}
              onChange={(e) => setBoughtAt(e.target.value)}
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
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
