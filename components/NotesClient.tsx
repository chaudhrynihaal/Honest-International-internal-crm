"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

export interface NoteDTO {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NoteCard({
  note,
  onSaved,
  onDeleted,
}: {
  note: NoteDTO;
  onSaved: (note: NoteDTO) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    const content = draft.trim();
    if (!content || content === note.content) {
      setEditing(false);
      setDraft(note.content);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to save note");
      const data = await res.json();
      onSaved(data.note);
      setEditing(false);
    } catch {
      setDraft(note.content);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      onDeleted(note.id);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  if (editing) {
    return (
      <div className="card flex flex-col gap-3 p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          rows={4}
          className="w-full resize-none rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setDraft(note.content);
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-black/5"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card relative flex flex-col gap-2 p-4">
      <p className="whitespace-pre-wrap pr-14 text-sm text-foreground">{note.content}</p>
      <p className="mt-auto text-xs text-foreground/40">{formatDate(note.updatedAt)}</p>

      {confirmingDelete ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-danger px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-foreground/60 hover:bg-black/5"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="absolute right-3 top-3 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-foreground/30 hover:bg-primary-light hover:text-primary"
            aria-label="Edit note"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="rounded-lg p-1.5 text-foreground/30 hover:bg-danger/10 hover:text-danger"
            aria-label="Delete note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export function NotesClient({ notes }: { notes: NoteDTO[] }) {
  const [list, setList] = useState(notes);
  const [newContent, setNewContent] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    const content = newContent.trim();
    if (!content || adding) return;

    setAdding(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const data = await res.json();
      setList((prev) => [data.note, ...prev]);
      setNewContent("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Notes</h1>
        <p className="mt-1 text-sm text-foreground/60">Jot down anything worth remembering.</p>
      </div>

      <div className="card p-4">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Write a note..."
          rows={3}
          className="w-full resize-none rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newContent.trim() || adding}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={16} />
            {adding ? "Adding..." : "Add Note"}
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-sm text-foreground/40">
          No notes yet. Add one above to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSaved={(updated) =>
                setList((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
              }
              onDeleted={(id) => setList((prev) => prev.filter((n) => n.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
