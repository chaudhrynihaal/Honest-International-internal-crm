"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatPKR } from "@/lib/currency";
import { StockLotModal } from "@/components/StockLotModal";
import type { FactoryStockLot } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FactoryStockTable({
  lots,
  onChanged,
}: {
  lots: FactoryStockLot[];
  onChanged: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingLot, setEditingLot] = useState<FactoryStockLot | null>(null);

  const existingYarnTypes = Array.from(new Set(lots.map((lot) => lot.yarnType))).sort();

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/factory-stock/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      onChanged();
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-black/5 text-xs font-semibold uppercase tracking-wide text-foreground/50">
            <th className="px-3 py-2">Yarn Type</th>
            <th className="px-3 py-2">Bags Remaining</th>
            <th className="px-3 py-2">Rate</th>
            <th className="px-3 py-2">Total Value</th>
            <th className="px-3 py-2">Bought</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => (
            <tr key={lot.id} className="border-b border-black/5 last:border-0 hover:bg-primary-light/40">
              <td className="px-3 py-3 font-medium text-foreground">{lot.yarnType}</td>
              <td className="px-3 py-3 text-foreground">{lot.bags.toLocaleString()} bags</td>
              <td className="px-3 py-3 text-foreground/70">{formatPKR(lot.rate)}</td>
              <td className="px-3 py-3 font-medium text-foreground">{formatPKR(lot.bags * lot.rate)}</td>
              <td className="px-3 py-3 whitespace-nowrap text-foreground/60">{formatDate(lot.boughtAt)}</td>
              <td className="px-3 py-3 text-right">
                {confirmingId === lot.id ? (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(lot.id)}
                      disabled={deletingId === lot.id}
                      className="rounded-lg bg-danger px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {deletingId === lot.id ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-foreground/60 hover:bg-black/5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingLot(lot)}
                      className="rounded-lg p-1.5 text-foreground/40 hover:bg-primary-light hover:text-primary"
                      aria-label={`Edit ${lot.yarnType} lot`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(lot.id)}
                      className="rounded-lg p-1.5 text-foreground/40 hover:bg-danger/10 hover:text-danger"
                      aria-label={`Delete ${lot.yarnType} lot`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {lots.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-foreground/40">
                No factory stock yet. Add a lot to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editingLot && (
        <StockLotModal
          lot={editingLot}
          existingYarnTypes={existingYarnTypes}
          onClose={() => setEditingLot(null)}
          onSuccess={() => {
            setEditingLot(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
