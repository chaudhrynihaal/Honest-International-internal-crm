import { startOfDay, subDays } from "date-fns";
import { prisma } from "./prisma";
import type { KpiCardData } from "./types";
import type { Prisma } from "@prisma/client";

async function sumQuantity(where: Prisma.EntryWhereInput) {
  const result = await prisma.entry.aggregate({ _sum: { quantity: true }, where });
  return result._sum.quantity ?? 0;
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return null;
    return 100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

async function roleBalance(role: string, unit: string, before?: Date) {
  const dateFilter: Prisma.DateTimeFilter | undefined = before ? { lt: before } : undefined;
  const [sent, received] = await Promise.all([
    sumQuantity({ type: "sent", unit, contact: { role }, ...(dateFilter ? { createdAt: dateFilter } : {}) }),
    sumQuantity({ type: "received", unit, contact: { role }, ...(dateFilter ? { createdAt: dateFilter } : {}) }),
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
    sumQuantity({ type: "sent", unit: "bags", createdAt: { gte: todayStart } }),
    sumQuantity({ type: "sent", unit: "bags", createdAt: { gte: yesterdayStart, lt: todayStart } }),
    sumQuantity({ type: "received", unit: "kg", createdAt: { gte: todayStart } }),
    sumQuantity({ type: "received", unit: "kg", createdAt: { gte: yesterdayStart, lt: todayStart } }),
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
