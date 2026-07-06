import { getKpis } from "@/lib/kpis";
import { getLedgerSummary } from "@/lib/ledger";
import { getFactoryStockSummary } from "@/lib/factoryStock";
import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/Dashboard";
import type { KpiCardData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [kpis, ledger, checklistItems, contacts, factoryStock] = await Promise.all([
    getKpis(),
    getLedgerSummary(),
    prisma.checklistItem.findMany({ orderBy: [{ done: "asc" }, { createdAt: "asc" }] }),
    prisma.contact.findMany({ orderBy: { name: "asc" } }),
    getFactoryStockSummary(),
  ]);

  const checklist = checklistItems.map((item) => ({
    id: item.id,
    task: item.task,
    meta: item.meta,
    done: item.done,
    dueDate: item.dueDate ? item.dueDate.toISOString() : null,
  }));

  const contactOptions = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role as "knitter" | "dyer",
  }));

  const totalStockBags = factoryStock.reduce((sum, s) => sum + s.totalBags, 0);
  const kpisWithStock: KpiCardData[] = [
    { key: "totalStockBags", label: "Total Bags in Stock", value: totalStockBags, unit: "bags", changePct: null },
    ...kpis,
  ];

  return (
    <Dashboard
      kpis={kpisWithStock}
      ledger={ledger}
      checklist={checklist}
      contacts={contactOptions}
      factoryStock={factoryStock}
    />
  );
}
