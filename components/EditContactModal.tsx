"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { LedgerRow } from "@/lib/types";

interface EditContactModalProps {
  contact: Pick<LedgerRow, "id" | "name" | "role">;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditContactModal({ contact, onClose, onSuccess }: EditContactModalProps) {
  const [name, setName] = useState(contact.name);
  const [role, setRole] = useState<"knitter" | "dyer">(contact.role);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update contact");
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
      <div className="card relative z-10 max-h-[90vh] w-full max-w-sm overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Edit Contact</h2>
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
            <label className="mb-1 block text-xs font-medium text-foreground/60">Name</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/60">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "knitter" | "dyer")}
              className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="knitter">Knitter</option>
              <option value="dyer">Dyer</option>
            </select>
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
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
