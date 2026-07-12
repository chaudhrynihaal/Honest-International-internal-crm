import { getLedgerSummary } from "@/lib/ledger";
import { getFactoryStockSummary } from "@/lib/factoryStock";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { RoleContactGrid } from "@/components/RoleContactGrid";

export const dynamic = "force-dynamic";

export default async function KnittingPage() {
  const [ledger, factoryStock, contactsRes] = await Promise.all([
    getLedgerSummary(),
    getFactoryStockSummary(),
    supabaseAdmin.from("Contact").select("id, name, role").order("name", { ascending: true }),
  ]);

  if (contactsRes.error) throw contactsRes.error;

  const rows = ledger.filter((r) => r.role === "knitter");
  const contacts = (contactsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role as "knitter" | "dyer",
  }));

  return (
    <RoleContactGrid
      title="Knitting"
      subtitle="All knitters and their outstanding bags/kg balance."
      rows={rows}
      contacts={contacts}
      factoryStock={factoryStock}
    />
  );
}
