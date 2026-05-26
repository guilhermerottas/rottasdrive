import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { CalendarRange } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUploadsByMonth } from "@/hooks/useAdminAnalytics";
import { ChartCard, ChartTip } from "./ChartCard";

export function UploadsByMonthChart() {
  const { data, isLoading } = useUploadsByMonth(12);

  const chartData = (data ?? []).map((d) => ({
    label: format(parseISO(d.periodo), "MMM/yy", { locale: ptBR }),
    total: d.total,
  }));
  const isEmpty = chartData.every((d) => d.total === 0);

  return (
    <ChartCard
      title="Uploads por mês (últimos 12 meses)"
      icon={<CalendarRange className="h-4 w-4 text-primary" />}
      isLoading={isLoading}
      isEmpty={!isLoading && isEmpty}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={260}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={36}
          />
          <Tooltip content={<ChartTip valueLabel="Uploads" />} cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48}>
            <LabelList
              dataKey="total"
              position="top"
              formatter={(v: number) => (v > 0 ? v : "")}
              style={{ fontSize: 11, fill: "#71717a", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
