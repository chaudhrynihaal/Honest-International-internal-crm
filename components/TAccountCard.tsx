"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, StickyNote } from "lucide-react";
import { formatPKR } from "@/lib/currency";
import type { ContactTAccount, CreditLine, DebitLine } from "@/lib/ledger";
import { PaymentModal } from "@/components/PaymentModal";
import { ManualLedgerEntryModal } from "@/components/ManualLedgerEntryModal";
import { EditEntryModal } from "@/components/EditEntryModal";
import { EditChargeModal } from "@/components/EditChargeModal";
import { EditPaymentModal } from "@/components/EditPaymentModal";
import { EditContactModal } from "@/components/EditContactModal";
import { EntryNoteModal } from "@/components/EntryNoteModal";

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface NotingLine {
  kind: "entries" | "payments" | "charges";
  id: string;
  amount: number;
  label: string;
  note: string | null;
}

export function TAccountCard({ account }: { account: ContactTAccount }) {
  const [paying, setPaying] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [confirmingContactDelete, setConfirmingContactDelete] = useState(false);
  const [deletingContact, setDeletingContact] = useState(false);
  const [editingCredit, setEditingCredit] = useState<(CreditLine & { quantity: number; unit: string; ratePerKg: number }) | null>(null);
  const [editingCharge, setEditingCharge] = useState<CreditLine | null>(null);
  const [editingDebit, setEditingDebit] = useState<DebitLine | null>(null);
  const [notingLine, setNotingLine] = useState<NotingLine | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(kind: "entries" | "payments" | "charges", id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/${kind}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  async function handleDeleteContact() {
    setDeletingContact(true);
    try {
      const res = await fetch(`/api/contacts/${account.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } finally {
      setDeletingContact(false);
      setConfirmingContactDelete(false);
    }
  }

  return (
    <div className="card p-10">
      <div className="group relative mb-3 text-center">
        <button
          type="button"
          onClick={() => setAddingEntry(true)}
          className="absolute left-0 top-0 rounded-full p-1 text-foreground/40 hover:bg-primary-light hover:text-primary"
          aria-label={`Add ledger entry for ${account.name}`}
        >
          <Plus size={16} />
        </button>

        {confirmingContactDelete ? (
          <div className="absolute right-0 top-0 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDeleteContact}
              disabled={deletingContact}
              className="rounded bg-danger px-2 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {deletingContact ? "..." : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingContactDelete(false)}
              className="rounded px-2 py-1 text-xs text-foreground/50 hover:bg-black/5"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="absolute right-0 top-0 hidden items-center gap-1.5 group-hover:flex">
            <button
              type="button"
              onClick={() => setEditingContact(true)}
              className="rounded p-1.5 text-foreground/40 hover:bg-primary-light hover:text-primary"
              aria-label={`Edit ${account.name}`}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmingContactDelete(true)}
              className="rounded p-1.5 text-foreground/40 hover:bg-danger/10 hover:text-danger"
              aria-label={`Delete ${account.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <p className="text-sm font-semibold text-foreground">{account.name}</p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            account.role === "knitter" ? "bg-secondary/10 text-secondary" : "bg-cyan/10 text-accent"
          }`}
        >
          {account.role}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-black/10 border-t border-black/10">
        <div className="min-w-0 p-9">
          <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-foreground/40">
            Debit (Paid)
          </p>
          {account.debits.length === 0 ? (
            <p className="text-center text-sm text-foreground/30">No payments yet</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {account.debits.map((l) => (
                <li key={l.id} className="group/line flex min-w-0 flex-col gap-0.5 text-sm">
                  <span
                    className="truncate text-foreground/60"
                    title={`${formatDateShort(l.date)} · ${l.description}`}
                  >
                    {formatDateShort(l.date)} · {l.description}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="whitespace-nowrap font-medium text-foreground">{formatPKR(l.amount)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setNotingLine({
                          kind: "payments",
                          id: l.id,
                          amount: l.amount,
                          label: `${formatDateShort(l.date)} · ${l.description}`,
                          note: l.note,
                        })
                      }
                      title={l.note ?? undefined}
                      aria-label={l.note ? "View or edit note" : "Add a note"}
                      className={`rounded p-0.5 hover:bg-primary-light hover:text-primary ${
                        l.note ? "text-primary" : "text-foreground/25"
                      }`}
                    >
                      <StickyNote size={14} />
                    </button>
                    {confirmingId === l.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete("payments", l.id)}
                          disabled={deletingId === l.id}
                          className="rounded px-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
                        >
                          {deletingId === l.id ? "..." : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="rounded px-1.5 text-xs text-foreground/50 hover:bg-black/5"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 pointer-events-none opacity-0 transition-opacity group-hover/line:pointer-events-auto group-hover/line:opacity-100">
                        <button
                          type="button"
                          onClick={() => setEditingDebit(l)}
                          className="rounded p-0.5 text-foreground/40 hover:bg-primary-light hover:text-primary"
                          aria-label="Edit payment"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(l.id)}
                          className="rounded p-0.5 text-foreground/40 hover:bg-danger/10 hover:text-danger"
                          aria-label="Delete payment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="min-w-0 p-9">
          <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-foreground/40">
            Credit (Billed)
          </p>
          {account.credits.length === 0 ? (
            <p className="text-center text-sm text-foreground/30">No bills yet</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {account.credits.map((l) => (
                <li key={l.id} className="group/line flex min-w-0 flex-col gap-0.5 text-sm">
                  <span
                    className="truncate text-foreground/60"
                    title={`${formatDateShort(l.date)} · ${l.description}`}
                  >
                    {formatDateShort(l.date)} · {l.description}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="whitespace-nowrap font-medium text-foreground">{formatPKR(l.amount)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setNotingLine({
                          kind: l.source === "entry" ? "entries" : "charges",
                          id: l.id,
                          amount: l.amount,
                          label: `${formatDateShort(l.date)} · ${l.description}`,
                          note: l.note,
                        })
                      }
                      title={l.note ?? undefined}
                      aria-label={l.note ? "View or edit note" : "Add a note"}
                      className={`rounded p-0.5 hover:bg-primary-light hover:text-primary ${
                        l.note ? "text-primary" : "text-foreground/25"
                      }`}
                    >
                      <StickyNote size={14} />
                    </button>
                    {confirmingId === l.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(l.source === "entry" ? "entries" : "charges", l.id)}
                          disabled={deletingId === l.id}
                          className="rounded px-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
                        >
                          {deletingId === l.id ? "..." : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="rounded px-1.5 text-xs text-foreground/50 hover:bg-black/5"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 pointer-events-none opacity-0 transition-opacity group-hover/line:pointer-events-auto group-hover/line:opacity-100">
                        <button
                          type="button"
                          onClick={() =>
                            l.source === "entry"
                              ? setEditingCredit(l as CreditLine & { quantity: number; unit: string; ratePerKg: number })
                              : setEditingCharge(l)
                          }
                          className="rounded p-0.5 text-foreground/40 hover:bg-primary-light hover:text-primary"
                          aria-label="Edit bill"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(l.id)}
                          className="rounded p-0.5 text-foreground/40 hover:bg-danger/10 hover:text-danger"
                          aria-label="Delete bill"
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3 text-sm font-semibold">
        <span className="text-foreground/70">Balance Due</span>
        <span className={account.balance > 0 ? "text-danger" : "text-success"}>
          {formatPKR(account.balance)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setPaying(true)}
        disabled={account.balance <= 0}
        className="mt-2 w-full rounded-lg bg-success px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
      >
        Paid
      </button>

      {paying && (
        <PaymentModal
          contactId={account.id}
          contactName={account.name}
          balanceDue={account.balance}
          onClose={() => setPaying(false)}
          onSuccess={() => {
            setPaying(false);
            router.refresh();
          }}
        />
      )}

      {addingEntry && (
        <ManualLedgerEntryModal
          contactId={account.id}
          contactName={account.name}
          onClose={() => setAddingEntry(false)}
          onSuccess={() => {
            setAddingEntry(false);
            router.refresh();
          }}
        />
      )}

      {editingContact && (
        <EditContactModal
          contact={account}
          onClose={() => setEditingContact(false)}
          onSuccess={() => {
            setEditingContact(false);
            router.refresh();
          }}
        />
      )}

      {editingCredit && (
        <EditEntryModal
          entry={editingCredit}
          onClose={() => setEditingCredit(null)}
          onSuccess={() => {
            setEditingCredit(null);
            router.refresh();
          }}
        />
      )}

      {editingCharge && (
        <EditChargeModal
          charge={editingCharge}
          onClose={() => setEditingCharge(null)}
          onSuccess={() => {
            setEditingCharge(null);
            router.refresh();
          }}
        />
      )}

      {editingDebit && (
        <EditPaymentModal
          payment={editingDebit}
          onClose={() => setEditingDebit(null)}
          onSuccess={() => {
            setEditingDebit(null);
            router.refresh();
          }}
        />
      )}

      {notingLine && (
        <EntryNoteModal
          kind={notingLine.kind}
          id={notingLine.id}
          amount={notingLine.amount}
          label={notingLine.label}
          note={notingLine.note}
          onClose={() => setNotingLine(null)}
          onSuccess={() => {
            setNotingLine(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
