import { getTrendData } from "@/lib/chart";
import { getLedgerSummary } from "@/lib/ledger";
import { TrendChart } from "@/components/TrendChart";
import { BagsPieChart } from "@/components/BagsPieChart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [trend, ledger] = await Promise.all([getTrendData(7), getLedgerSummary()]);

  const knitterBags = ledger
    .filter((c) => c.role === "knitter" && c.balanceBags > 0)
    .map((c) => ({ name: c.name, value: c.balanceBags }));

  const dyerBags = ledger
    .filter((c) => c.role === "dyer" && c.balanceBags > 0)
    .map((c) => ({ name: c.name, value: c.balanceBags }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Trends and outstanding bag balances across your network.
        </p>
      </div>

      <div className="card p-5">
        <TrendChart data={trend} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <BagsPieChart
            title="Bags with Knitters"
            subtitle="Outstanding bag balance per knitter"
            data={knitterBags}
            unit="bags"
          />
        </div>
        <div className="card p-5">
          <BagsPieChart
            title="Bags with Dyers"
            subtitle="Outstanding bag balance per dyer"
            data={dyerBags}
            unit="bags"
          />
        </div>
      </div>
    </div>
  );
}
