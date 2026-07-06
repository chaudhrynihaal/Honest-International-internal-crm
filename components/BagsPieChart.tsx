"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Fixed categorical order (validated for CVD-safety) — never reassigned by rank.
const CATEGORICAL_COLORS = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];
const OTHER_COLOR = "#898781";

export interface PieSlice {
  name: string;
  value: number;
}

interface Slice extends PieSlice {
  color: string;
}

function buildSlices(data: PieSlice[]): Slice[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);

  if (sorted.length <= 8) {
    return sorted.map((d, i) => ({ ...d, color: CATEGORICAL_COLORS[i] }));
  }

  const top = sorted.slice(0, 7).map((d, i) => ({ ...d, color: CATEGORICAL_COLORS[i] }));
  const otherValue = sorted.slice(7).reduce((sum, d) => sum + d.value, 0);
  return [...top, { name: "Other", value: otherValue, color: OTHER_COLOR }];
}

export function BagsPieChart({
  title,
  subtitle,
  data,
  unit,
}: {
  title: string;
  subtitle: string;
  data: PieSlice[];
  unit: string;
}) {
  const slices = buildSlices(data);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-foreground/50">{subtitle}</p>

      {total === 0 ? (
        <div className="flex h-72 items-center justify-center">
          <p className="text-sm text-foreground/40">No outstanding {unit} to show.</p>
        </div>
      ) : (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {slices.map((s) => (
                  <Cell key={s.name} fill={s.color} stroke="#fcfcfb" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${Number(value).toLocaleString()} ${unit}`, name]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #eee",
                  fontSize: 13,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
