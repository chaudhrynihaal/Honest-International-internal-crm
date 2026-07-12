"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { StockLotModal } from "@/components/StockLotModal";
import { FactoryStockTable } from "@/components/FactoryStockTable";
import { formatPKR, formatPKRCompact } from "@/lib/currency";
import type { FactoryStockLot, FactoryStockSummaryRow } from "@/lib/types";

interface FactoryStockClientProps {
  lots: FactoryStockLot[];
  summary: FactoryStockSummaryRow[];
}

function KgPerBagInput({ yarnType, kgPerBag, onSaved }: { yarnType: string; kgPerBag: number; onSaved: () => void }) {
  const [value, setValue] = useState(String(kgPerBag));
  const [saving, setSaving] = useState(false);

  async function save() {
    const num = Number(value);
    if (!num || num <= 0 || num === kgPerBag) {
      setValue(String(kgPerBag));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/yarn-types/${encodeURIComponent(yarnType)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kgPerBag: num }),
      });
      if (res.ok) onSaved();
      else setValue(String(kgPerBag));
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="mt-2 flex items-center gap-1.5 text-xs text-foreground/50">
      Kg/Bag:
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        className="w-16 rounded border border-black/10 bg-background px-1.5 py-0.5 text-xs text-foreground outline-none focus:border-primary disabled:opacity-50"
      />
    </label>
  );
}

export function FactoryStockClient({ lots, summary }: FactoryStockClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const totalBags = summary.reduce((sum, s) => sum + s.totalBags, 0);
  const totalValue = lots.reduce((sum, lot) => sum + lot.bags * lot.rate, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Factory Stock</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Raw yarn inventory. Sending bags to a knitter or dyer deducts automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
        >
          <Plus size={18} />
          Add Stock
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm font-medium text-foreground/60">Total Bags in Stock</p>
          <p className="mt-2 text-2xl font-semibold text-primary">{totalBags.toLocaleString()} bags</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-foreground/60">Total Stock Value</p>
          <p className="mt-2 text-2xl font-semibold text-primary" title={formatPKR(totalValue)}>
            {formatPKRCompact(totalValue)}
          </p>
        </div>
        {summary.map((s) => (
          <div key={s.yarnType} className="card p-5">
            <p className="truncate text-sm font-medium text-foreground/60">{s.yarnType}</p>
            <p className="mt-2 text-2xl font-semibold text-primary">{s.totalBags.toLocaleString()} bags</p>
            <KgPerBagInput yarnType={s.yarnType} kgPerBag={s.kgPerBag} onSaved={() => router.refresh()} />
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-foreground">Stock Lots</h2>
        <div className="mt-4">
          <FactoryStockTable lots={lots} onChanged={() => router.refresh()} />
        </div>
      </div>

      {modalOpen && (
        <StockLotModal
          onClose={() => setModalOpen(false)}
          existingYarnTypes={summary.map((s) => s.yarnType)}
          onSuccess={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
