"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { LogEntryModal, type ContactOption } from "@/components/LogEntryModal";
import type { FactoryStockSummaryRow } from "@/lib/types";

interface ContactDetailHeaderProps {
  contact: { id: string; name: string; role: "knitter" | "dyer"; phone: string | null };
  balance: {
    totalSentBags: number;
    totalReceivedBags: number;
    totalSentKg: number;
    totalReceivedKg: number;
    balanceBags: number;
    balanceKg: number;
  };
  contacts: ContactOption[];
  factoryStock: FactoryStockSummaryRow[];
}

function BalanceCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  const isNeg = value < 0;
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-foreground/50">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${isNeg ? "text-danger" : "text-success"}`}>
        {value.toLocaleString()} {unit}
      </p>
    </div>
  );
}

export function ContactDetailHeader({ contact, balance, contacts, factoryStock }: ContactDetailHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-primary"
          >
            <ArrowLeft size={14} />
            Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{contact.name}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                contact.role === "knitter" ? "bg-secondary/10 text-secondary" : "bg-cyan/10 text-accent"
              }`}
            >
              {contact.role}
            </span>
          </div>
          {contact.phone && <p className="mt-1 text-sm text-foreground/50">{contact.phone}</p>}
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
        >
          <Plus size={18} />
          Add Entry
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <BalanceCard label="Total Sent (Bags)" value={balance.totalSentBags} unit="bags" />
        <BalanceCard label="Total Received (Bags)" value={balance.totalReceivedBags} unit="bags" />
        <BalanceCard label="Total Sent (Kg)" value={balance.totalSentKg} unit="kg" />
        <BalanceCard label="Total Received (Kg)" value={balance.totalReceivedKg} unit="kg" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BalanceCard label="Running Balance (Bags)" value={balance.balanceBags} unit="bags" />
        <BalanceCard label="Running Balance (Kg)" value={balance.balanceKg} unit="kg" />
      </div>

      {modalOpen && (
        <LogEntryModal
          onClose={() => setModalOpen(false)}
          contacts={contacts}
          factoryStock={factoryStock}
          defaultContactId={contact.id}
          onSuccess={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
