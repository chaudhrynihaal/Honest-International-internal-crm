"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatPKR } from "@/lib/currency";
import type { FactoryStockSummaryRow } from "@/lib/types";

export interface ContactOption {
  id: string;
  name: string;
  role: "knitter" | "dyer";
}

interface LogEntryModalProps {
  onClose: () => void;
  contacts: ContactOption[];
  factoryStock: FactoryStockSummaryRow[];
  onSuccess: () => void;
  defaultContactId?: string;
}

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LogEntryModal({
  onClose,
  contacts,
  factoryStock,
  onSuccess,
  defaultContactId,
}: LogEntryModalProps) {
  const [contactMode, setContactMode] = useState<"existing" | "new">("existing");
  const [contactId, setContactId] = useState(defaultContactId ?? "");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"knitter" | "dyer">("knitter");
  const [type, setType] = useState<"sent" | "received">("sent");
  const [unit, setUnit] = useState<"bags" | "kg">("bags");
  const [quantity, setQuantity] = useState("");
  const [yarnType, setYarnType] = useState("");
  const [ratePerKg, setRatePerKg] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => toDatetimeLocal(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requiresYarnType = type === "sent" && unit === "bags";
  const showRateField = type === "sent";
  const availableStock = factoryStock.filter((s) => s.totalBags > 0);

  const qtyNum = Number(quantity);
  const rateNum = Number(ratePerKg);
  const totalBill = qtyNum > 0 && rateNum > 0 ? qtyNum * rateNum : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (contactMode === "existing" && !contactId) {
      setError("Please select a contact");
      return;
    }
    if (contactMode === "new" && !newName.trim()) {
      setError("Please enter a name for the new contact");
      return;
    }
    if (requiresYarnType && !yarnType) {
      setError("Please select a yarn type to deduct from factory stock");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type,
        unit,
        quantity: qty,
        note: note.trim() || undefined,
        createdAt: new Date(date).toISOString(),
      };
      if (requiresYarnType) {
        payload.yarnType = yarnType;
      }
      if (showRateField && rateNum > 0) {
        payload.ratePerKg = rateNum;
      }
      if (contactMode === "existing") {
        payload.contactId = contactId;
      } else {
        payload.newContact = { name: newName.trim(), role: newRole };
      }

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save entry");
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
      <div className="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Log Entry</h2>
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
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => setContactMode("existing")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  contactMode === "existing" ? "bg-primary text-white" : "bg-black/5 text-foreground/60"
                }`}
              >
                Existing Contact
              </button>
              <button
                type="button"
                onClick={() => setContactMode("new")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  contactMode === "new" ? "bg-primary text-white" : "bg-black/5 text-foreground/60"
                }`}
              >
                New Contact
              </button>
            </div>

            {contactMode === "existing" ? (
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Select a contact...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contact name"
                  className="flex-1 rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "knitter" | "dyer")}
                  className="rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="knitter">Knitter</option>
                  <option value="dyer">Dyer</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "sent" | "received")}
                className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="sent">Sent</option>
                <option value="received">Received</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as "bags" | "kg")}
                className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="bags">Bags</option>
                <option value="kg">Kg</option>
              </select>
            </div>
          </div>

          {requiresYarnType && (
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">
                Yarn Type (deducts from factory stock)
              </label>
              <select
                value={yarnType}
                onChange={(e) => setYarnType(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Select yarn type...</option>
                {availableStock.map((s) => (
                  <option key={s.yarnType} value={s.yarnType}>
                    {s.yarnType} ({s.totalBags.toLocaleString()} bags available)
                  </option>
                ))}
              </select>
              {availableStock.length === 0 && (
                <p className="mt-1 text-xs text-danger">
                  No factory stock available. Add stock first from the Factory Stock page.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">Date</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {showRateField && (
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">
                Rate per Kg (optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={ratePerKg}
                onChange={(e) => setRatePerKg(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {totalBill !== null && (
                <p className="mt-1.5 text-sm font-semibold text-primary">
                  Total Bill: {formatPKR(totalBill)}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/60">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
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
              {submitting ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
