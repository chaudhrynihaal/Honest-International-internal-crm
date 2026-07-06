import { getFactoryStockLots, getFactoryStockSummary } from "@/lib/factoryStock";
import { FactoryStockClient } from "@/components/FactoryStockClient";

export const dynamic = "force-dynamic";

export default async function FactoryStockPage() {
  const [lots, summary] = await Promise.all([getFactoryStockLots(), getFactoryStockSummary()]);

  return <FactoryStockClient lots={lots} summary={summary} />;
}
