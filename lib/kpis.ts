import { startOfDay, subDays } from "date-fns";
import { supabaseAdmin } from "./supabase/admin";
import type { KpiCardData } from "./types";

interface QuantityFilter {
  type?: "sent" | "received";
  unit?: "bags" | "kg";
  createdAtGte?: string;
  createdAtLt?: string;
  contactIds?: string[];
}

async function sumQuantity(filter: QuantityFilter): Promise<number> {
  if (filter.contactIds && filter.contactIds.length === 0) return 0;

  let query = supabaseAdmin.from("Entry").select("quantity");
  if (filter.type) query = query.eq("type", filter.type);
  if (filter.unit) query = query.eq("unit", filter.unit);
  if (filter.createdAtGte) query = query.gte("createdAt", filter.createdAtGte);
  if (filter.createdAtLt) query = query.lt("createdAt", filter.createdAtLt);
  if (filter.contactIds) query = query.in("contactId", filter.contactIds);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return null;
    return 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

async function contactIdsForRole(role: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin.from("Contact").select("id").eq("role", role);
  if (error) throw error;
  return (data ?? []).map((c) => c.id);
}

async function roleBalance(role: string, unit: "bags" | "kg", before?: Date): Promise<number> {
  const contactIds = await contactIdsForRole(role);
  const dateFilter = before ? { createdAtLt: before.toISOString() } : {};

  const [sent, received] = await Promise.all([
    sumQuantity({ type: "sent", unit, contactIds, ...dateFilter }),
    sumQuantity({ type: "received", unit, contactIds, ...dateFilter }),
  ]);
  return sent - received;
}

export async function getKpis(): Promise<KpiCardData[]> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));

  const [
    bagsSentToday,
    bagsSentYesterday,
    kgReceivedToday,
    kgReceivedYesterday,
    kgPendingKnittersNow,
    kgPendingKnittersYesterday,
    bagsPendingDyersNow,
    bagsPendingDyersYesterday,
  ] = await Promise.all([
    sumQuantity({ type: "sent", unit: "bags", createdAtGte: todayStart.toISOString() }),
    sumQuantity({
      type: "sent",
      unit: "bags",
      createdAtGte: yesterdayStart.toISOString(),
      createdAtLt: todayStart.toISOString(),
    }),
    sumQuantity({ type: "received", unit: "kg", createdAtGte: todayStart.toISOString() }),
    sumQuantity({
      type: "received",
      unit: "kg",
      createdAtGte: yesterdayStart.toISOString(),
      createdAtLt: todayStart.toISOString(),
    }),
    roleBalance("knitter", "kg"),
    roleBalance("knitter", "kg", todayStart),
    roleBalance("dyer", "bags"),
    roleBalance("dyer", "bags", todayStart),
  ]);

  return [
    {
      key: "bagsSentToday",
      label: "Bags Sent Today",
      value: bagsSentToday,
      unit: "bags",
      changePct: percentChange(bagsSentToday, bagsSentYesterday),
    },
    {
      key: "kgReceivedToday",
      label: "Kgs Received Today",
      value: kgReceivedToday,
      unit: "kg",
      changePct: percentChange(kgReceivedToday, kgReceivedYesterday),
    },
    {
      key: "kgPendingKnitters",
      label: "Kgs Pending with Knitters",
      value: kgPendingKnittersNow,
      unit: "kg",
      changePct: percentChange(kgPendingKnittersNow, kgPendingKnittersYesterday),
    },
    {
      key: "bagsPendingDyers",
      label: "Pending with Dyers",
      value: bagsPendingDyersNow,
      unit: "bags",
      changePct: percentChange(bagsPendingDyersNow, bagsPendingDyersYesterday),
    },
  ];
}
