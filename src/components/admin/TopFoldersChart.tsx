import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { FolderTree } from "lucide-react";
import { useTopFolders } from "@/hooks/useAdminAnalytics";
import { ChartCard } from "./ChartCard";

interface Row {
  label: string;
  obra: string;
  total: number;
}

function FolderTip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs space-y-1 min-w-[180px]">
      <p className="font-semibold text-foreground">{row.label}</p>
      <p className="text-muted-foreground">{row.obra}</p>
      <p className="text-muted-foreground">
        Arquivos: <span className="font-semibold text-foreground">{row.total}</span>
      </p>
    </div>
  );
}

export function TopFoldersChart() {
  const { data, isLoading } = useTopFolders(10);

  const chartData: Row[] = (data ?? []).map((d) => ({
    label: d.pasta_nome,
    obra: d.obra_nome,
    total: d.total,
  }));
  const isEmpty = chartData.length === 0;
  const height = Math.max(220, chartData.length * 44);

  return (
    <ChartCard
      title="Pastas com mais arquivos"
      icon={<FolderTree className="h-4 w-4 text-primary" />}
      isLoading={isLoading}
      isEmpty={!isLoading && isEmpty}
      emptyLabel="Nenhuma pasta com arquivos"
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 32, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip content={<FolderTip />} cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={28}>
            <LabelList
              dataKey="total"
              position="right"
              style={{ fontSize: 11, fontWeight: 700, fill: "#71717a" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
