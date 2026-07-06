"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export interface ChecklistItemDTO {
  id: string;
  task: string;
  meta: string | null;
  done: boolean;
  dueDate: string | null;
}

export function ChecklistPanel({ items }: { items: ChecklistItemDTO[] }) {
  const [list, setList] = useState(items);
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);

  async function toggle(id: string, nextDone: boolean) {
    setList((prev) => prev.map((i) => (i.id === id ? { ...i, done: nextDone } : i)));
    try {
      const res = await fetch("/api/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, done: nextDone }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      setList((prev) => prev.map((i) => (i.id === id ? { ...i, done: !nextDone } : i)));
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const task = newTask.trim();
    if (!task || adding) return;

    setNewTask("");
    setAdding(true);
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const { item } = await res.json();
      setList((prev) => [...prev, item]);
    } catch {
      setNewTask(task);
    } finally {
      setAdding(false);
    }
  }

  const pendingCount = list.filter((i) => !i.done).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Checklist</h2>
        <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
          {pendingCount} pending
        </span>
      </div>

      <ul className="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto">
        {list.length === 0 && (
          <li className="text-sm text-foreground/40">No tasks yet — add one below.</li>
        )}
        {list.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-primary-light/60"
          >
            <input
              type="checkbox"
              checked={item.done}
              onChange={(e) => toggle(item.id, e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#6F42C1]"
            />
            <div className="min-w-0">
              <p className={`text-sm ${item.done ? "text-foreground/40 line-through" : "text-foreground"}`}>
                {item.task}
              </p>
              {item.meta && <p className="text-xs text-foreground/50">{item.meta}</p>}
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={addItem} className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!newTask.trim() || adding}
          className="flex items-center justify-center rounded-lg bg-primary p-2 text-white disabled:opacity-40"
          aria-label="Add task"
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
