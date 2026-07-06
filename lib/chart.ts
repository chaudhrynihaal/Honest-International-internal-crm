import { format, startOfDay, subDays } from "date-fns";
import { supabaseAdmin } from "./supabase/admin";
import type { TrendPoint } from "./types";

export async function getTrendData(days = 7): Promise<TrendPoint[]> {
  const now = new Date();
  const rangeStart = startOfDay(subDays(now, days - 1));

  const { data, error } = await supabaseAdmin
    .from("Entry")
    .select("type, unit, quantity, createdAt")
    .gte("createdAt", rangeStart.toISOString());

  if (error) throw error;

  const entries = (data ?? []).filter(
    (e) => (e.type === "sent" && e.unit === "bags") || (e.type === "received" && e.unit === "kg"),
  );

  const buckets = new Map<string, TrendPoint>();
  for (let i = 0; i < days; i++) {
    const d = startOfDay(subDays(now, days - 1 - i));
    const key = format(d, "yyyy-MM-dd");
    buckets.set(key, { date: key, label: format(d, "EEE"), bagsSent: 0, kgReceived: 0 });
  }

  for (const e of entries) {
    const key = format(startOfDay(new Date(e.createdAt)), "yyyy-MM-dd");
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (e.type === "sent" && e.unit === "bags") bucket.bagsSent += e.quantity;
    if (e.type === "received" && e.unit === "kg") bucket.kgReceived += e.quantity;
  }

  return Array.from(buckets.values());
}
