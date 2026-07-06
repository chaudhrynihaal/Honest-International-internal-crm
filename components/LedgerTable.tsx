"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import type { LedgerRow } from "@/lib/types";
import { EditContactModal } from "@/components/EditContactModal";

type SortKey = "name" | "role" | "totalSent" | "totalReceived" | "balance" | "lastEntryAt";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Contact" },
  { key: "role", label: "Role" },
  { key: "totalSent", label: "Total Sent" },
  { key: "totalReceived", label: "Total Received" },
  { key: "balance", label: "Balance" },
  { key: "lastEntryAt", label: "Last Entry" },
];

function sortValue(row: LedgerRow, key: SortKey): number | string {
  switch (key) {
    case "name":
      return row.name.toLowerCase();
    case "role":
      return row.role;
    case "totalSent":
      return row.totalSentBags * 1000 + row.totalSentKg;
    case "totalReceived":
      return row.totalReceivedBags * 1000 + row.totalReceivedKg;
    case "balance":
      return row.balanceBags * 1000 + row.balanceKg;
    case "lastEntryAt":
      return row.lastEntryAt ? new Date(row.lastEntryAt).getTime() : 0;
  }
}

function formatRelative(iso: string | null) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function Quantities({ bags, kg }: { bags: number; kg: number }) {
  if (bags === 0 && kg === 0) return <span className="text-foreground/40">—</span>;
  return (
    <div className="flex flex-col text-sm">
      {bags !== 0 && <span>{bags.toLocaleString()} bags</span>}
      {kg !== 0 && <span>{kg.toLocaleString()} kg</span>}
    </div>
  );
}

function Balance({ bags, kg }: { bags: number; kg: number }) {
  if (bags === 0 && kg === 0) return <span className="text-foreground/40">—</span>;
  return (
    <div className="flex flex-col text-sm font-medium">
      {bags !== 0 && (
        <span className={bags < 0 ? "text-danger" : "text-success"}>{bags.toLocaleString()} bags</span>
      )}
      {kg !== 0 && (
        <span className={kg < 0 ? "text-danger" : "text-success"}>{kg.toLocaleString()} kg</span>
      )}
    </div>
  );
}

export function LedgerTable({ rows }: { rows: LedgerRow[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editingContact, setEditingContact] = useState<LedgerRow | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground">Ledger Summary</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-black/5 text-xs font-semibold uppercase tracking-wide text-foreground/50">
              {COLUMNS.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-3 py-2">
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown size={12} className="opacity-30" />
                    )}
                  </button>
                </th>
              ))}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.id}
                onClick={() => router.push(`/contacts/${row.id}`)}
                className="cursor-pointer border-b border-black/5 text-sm transition-colors last:border-0 hover:bg-primary-light/50"
              >
                <td className="px-3 py-3 font-medium text-foreground">{row.name}</td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      row.role === "knitter"
                        ? "bg-secondary/10 text-secondary"
                        : "bg-cyan/10 text-accent"
                    }`}
                  >
                    {row.role}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <Quantities bags={row.totalSentBags} kg={row.totalSentKg} />
                </td>
                <td className="px-3 py-3">
                  <Quantities bags={row.totalReceivedBags} kg={row.totalReceivedKg} />
                </td>
                <td className="px-3 py-3">
                  <Balance bags={row.balanceBags} kg={row.balanceKg} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-foreground/60">
                  {formatRelative(row.lastEntryAt)}
                </td>
                <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {confirmingId === row.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={deletingId === row.id}
                        className="rounded-lg bg-danger px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {deletingId === row.id ? "Deleting..." : "Confirm"}
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
                        onClick={() => setEditingContact(row)}
                        className="rounded-lg p-1.5 text-foreground/40 hover:bg-primary-light hover:text-primary"
                        aria-label={`Edit ${row.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(row.id)}
                        className="rounded-lg p-1.5 text-foreground/40 hover:bg-danger/10 hover:text-danger"
                        aria-label={`Delete ${row.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-3 py-6 text-center text-sm text-foreground/40">
                  No contacts yet. Log an entry to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSuccess={() => {
            setEditingContact(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
