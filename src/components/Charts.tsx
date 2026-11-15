"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = { stroke: "#6b6b7b", fontSize: 12, tickLine: false, axisLine: false } as const;
const tooltipStyle = {
  contentStyle: { background: "#1d1d26", border: "1px solid #2a2a35", borderRadius: 12, color: "#fff" },
  labelStyle: { color: "#9b9bab" },
  cursor: { fill: "rgba(249,115,22,0.08)" },
};

const compact = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n)));

export function VolumeChart({ data, unit }: { data: { label: string; volume: number }[]; unit: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#2a2a35" />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} tickFormatter={compact} width={44} />
        <Tooltip
          {...tooltipStyle}
          formatter={(v) => [`${Number(v).toLocaleString("en-US")} ${unit}`, "Volume"]}
        />
        <Bar dataKey="volume" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProgressChart({
  data,
  unit,
}: {
  data: { label: string; best: number; e1rm: number }[];
  unit: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#2a2a35" />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={44} domain={["auto", "auto"]} />
        <Tooltip
          {...tooltipStyle}
          cursor={{ stroke: "#3a3a48" }}
          formatter={(v, name) => [`${v} ${unit}`, name === "best" ? "Heaviest set" : "Est. 1RM"]}
        />
        <Line type="monotone" dataKey="e1rm" stroke="#71717a" strokeDasharray="4 4" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="best" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: "#f97316" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
