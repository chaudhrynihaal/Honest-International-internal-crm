import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { KpiCardData } from "@/lib/types";

function formatValue(value: number, unit: string) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded.toLocaleString()} ${unit}`;
}

export function KpiGrid({ kpis }: { kpis: KpiCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const isUp = (kpi.changePct ?? 0) > 0;
        const isDown = (kpi.changePct ?? 0) < 0;
        const isFlat = kpi.changePct === null || kpi.changePct === 0;

        return (
          <div key={kpi.key} className="card p-5">
            <p className="text-sm font-medium text-foreground/60">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold text-primary">
              {formatValue(kpi.value, kpi.unit)}
            </p>
            <div
              className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isUp
                  ? "bg-success/10 text-success"
                  : isDown
                    ? "bg-danger/10 text-danger"
                    : "bg-black/5 text-foreground/50"
              }`}
            >
              {isUp && <ArrowUpRight size={14} />}
              {isDown && <ArrowDownRight size={14} />}
              {isFlat && <Minus size={14} />}
              {kpi.changePct === null ? "No change" : `${Math.abs(kpi.changePct).toFixed(1)}% vs yesterday`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
