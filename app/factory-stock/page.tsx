import { getFactoryStockLots, getFactoryStockSummary } from "@/lib/factoryStock";
import { FactoryStockClient } from "@/components/FactoryStockClient";

export const dynamic = "force-dynamic";

export default async function FactoryStockPage() {
  const [lotsRaw, summary] = await Promise.all([getFactoryStockLots(), getFactoryStockSummary()]);

  const lots = lotsRaw.map((lot) => ({
    id: lot.id,
    yarnType: lot.yarnType,
    bags: lot.bags,
    rate: lot.rate,
    boughtAt: lot.boughtAt.toISOString(),
    createdAt: lot.createdAt.toISOString(),
  }));

  return <FactoryStockClient lots={lots} summary={summary} />;
}
