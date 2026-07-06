"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

function getGreeting(hour: number) {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function Header({ onLogEntry }: { onLogEntry: () => void }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" suppressHydrationWarning>
          {getGreeting(now.getHours())}
        </h1>
        <p className="mt-1 text-sm text-foreground/60" suppressHydrationWarning>
          {now.toLocaleString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      </div>

      <button
        type="button"
        onClick={onLogEntry}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
      >
        <Plus size={18} />
        Log Entry
      </button>
    </div>
  );
}
