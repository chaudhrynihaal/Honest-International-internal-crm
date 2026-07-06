"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-foreground">Weekly Trend</h2>
      <p className="text-sm text-foreground/50">Bags sent vs. kilograms received, last 7 days</p>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ecef" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6c757d" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6c757d" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #eee",
                fontSize: 13,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="bagsSent" name="Bags Sent" fill="#007BFF" radius={[6, 6, 0, 0]} />
            <Bar dataKey="kgReceived" name="Kgs Received" fill="#17A2B8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
