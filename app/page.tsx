import { getKpis } from "@/lib/kpis";
import { getLedgerSummary } from "@/lib/ledger";
import { getFactoryStockSummary } from "@/lib/factoryStock";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Dashboard } from "@/components/Dashboard";
import type { KpiCardData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [kpis, ledger, checklistRes, contactsRes, factoryStock] = await Promise.all([
    getKpis(),
    getLedgerSummary(),
    supabaseAdmin.from("ChecklistItem").select("*").order("done", { ascending: true }).order("createdAt", { ascending: true }),
    supabaseAdmin.from("Contact").select("*").order("name", { ascending: true }),
    getFactoryStockSummary(),
  ]);

  if (checklistRes.error) throw checklistRes.error;
  if (contactsRes.error) throw contactsRes.error;

  const checklistItems = checklistRes.data ?? [];
  const contacts = contactsRes.data ?? [];

  const checklist = checklistItems.map((item) => ({
    id: item.id,
    task: item.task,
    meta: item.meta,
    done: item.done,
    dueDate: item.dueDate ?? null,
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
