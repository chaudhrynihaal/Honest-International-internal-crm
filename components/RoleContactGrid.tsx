"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { LogEntryModal, type ContactOption } from "@/components/LogEntryModal";
import type { FactoryStockSummaryRow, LedgerRow } from "@/lib/types";

function formatRelative(iso: string | null) {
  if (!iso) return "No activity yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

interface RoleContactGridProps {
  title: string;
  subtitle: string;
  rows: LedgerRow[];
  contacts: ContactOption[];
  factoryStock: FactoryStockSummaryRow[];
}

export function RoleContactGrid({ title, subtitle, rows, contacts, factoryStock }: RoleContactGridProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-foreground/60">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
        >
          <Plus size={18} />
          Log Entry
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/contacts/${row.id}`}
            className="card flex flex-col gap-3 p-5 transition-shadow hover:shadow-md"
          >
            <p className="truncate text-base font-semibold text-foreground">{row.name}</p>

            <div className="flex flex-wrap gap-2 text-sm">
              {row.balanceBags !== 0 && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    row.balanceBags < 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                  }`}
                >
                  {row.balanceBags.toLocaleString()} bags
                </span>
              )}
              {row.balanceKg !== 0 && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    row.balanceKg < 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                  }`}
                >
                  {row.balanceKg.toLocaleString()} kg
                </span>
              )}
              {row.balanceBags === 0 && row.balanceKg === 0 && (
                <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-foreground/40">
                  Settled
                </span>
              )}
            </div>

            <p className="text-xs text-foreground/50">{formatRelative(row.lastEntryAt)}</p>
          </Link>
        ))}

        {rows.length === 0 && (
          <p className="text-sm text-foreground/40">No contacts yet. Log an entry to get started.</p>
        )}
      </div>

      {modalOpen && (
        <LogEntryModal
          onClose={() => setModalOpen(false)}
          contacts={contacts}
          factoryStock={factoryStock}
          onSuccess={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
