"use client";

import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import { formatPKR } from "@/lib/currency";
import type { ContactTAccount } from "@/lib/ledger";
import { TAccountCard } from "@/components/TAccountCard";

function CardGrid({ accounts }: { accounts: ContactTAccount[] }) {
  const knitters = accounts.filter((a) => a.role === "knitter");
  const dyers = accounts.filter((a) => a.role === "dyer");

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Knitters</h2>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {knitters.map((a) => (
            <TAccountCard key={a.id} account={a} />
          ))}
          {knitters.length === 0 && <p className="text-sm text-foreground/40">No knitters yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Dyers</h2>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {dyers.map((a) => (
            <TAccountCard key={a.id} account={a} />
          ))}
          {dyers.length === 0 && <p className="text-sm text-foreground/40">No dyers yet.</p>}
        </div>
      </section>
    </div>
  );
}

export function LedgerView({ accounts }: { accounts: ContactTAccount[] }) {
  const [fullscreen, setFullscreen] = useState(false);

  const totalCredits = accounts.reduce((sum, a) => sum + a.totalCredits, 0);
  const totalDebits = accounts.reduce((sum, a) => sum + a.totalDebits, 0);
  const totalBalanceDue = accounts.reduce((sum, a) => sum + Math.max(a.balance, 0), 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Ledger</h1>
          <p className="mt-1 text-sm text-foreground/60">
            T-accounts of processing bills for each knitter and dyer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-foreground/60 hover:bg-primary-light hover:text-primary"
          aria-label="Open fullscreen ledger view"
          title="Fullscreen"
        >
          <Maximize2 size={16} />
          Fullscreen
        </button>
      </div>

      <CardGrid accounts={accounts} />

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between border-b border-black/10 bg-surface px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">Ledger — Full Overview</h2>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="rounded-lg p-2 text-foreground/50 hover:bg-primary-light hover:text-primary"
              aria-label="Close fullscreen ledger view"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="card p-4">
                <p className="text-xs font-medium text-foreground/50">Contacts</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{accounts.length}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-medium text-foreground/50">Total Billed</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{formatPKR(totalCredits)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-medium text-foreground/50">Total Paid</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{formatPKR(totalDebits)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-medium text-foreground/50">Total Balance Due</p>
                <p className="mt-1 text-xl font-semibold text-danger">{formatPKR(totalBalanceDue)}</p>
              </div>
            </div>

            <CardGrid accounts={accounts} />
          </div>
        </div>
      )}
    </div>
  );
}
