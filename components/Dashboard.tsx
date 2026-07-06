"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { KpiGrid } from "@/components/KpiGrid";
import { ChecklistPanel, type ChecklistItemDTO } from "@/components/ChecklistPanel";
import { LedgerTable } from "@/components/LedgerTable";
import { LogEntryModal, type ContactOption } from "@/components/LogEntryModal";
import type { FactoryStockSummaryRow, KpiCardData, LedgerRow } from "@/lib/types";

interface DashboardProps {
  kpis: KpiCardData[];
  ledger: LedgerRow[];
  checklist: ChecklistItemDTO[];
  contacts: ContactOption[];
  factoryStock: FactoryStockSummaryRow[];
}

export function Dashboard({ kpis, ledger, checklist, contacts, factoryStock }: DashboardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <Header onLogEntry={() => setModalOpen(true)} />

      <KpiGrid kpis={kpis} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <LedgerTable rows={ledger} />
        </div>
        <div className="card p-5">
          <ChecklistPanel items={checklist} />
        </div>
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
