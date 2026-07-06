import { getContactTAccounts } from "@/lib/ledger";
import { LedgerView } from "@/components/LedgerView";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const accounts = await getContactTAccounts();

  return <LedgerView accounts={accounts} />;
}
