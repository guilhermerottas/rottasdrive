import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { CalendarClock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useUploadsByWeek } from "@/hooks/useAdminAnalytics";
import { ChartCard, ChartTip } from "./ChartCard";

export function UploadsByWeekChart() {
  const { data, isLoading } = useUploadsByWeek(12);

  const chartData = (data ?? []).map((d) => ({
    label: format(parseISO(d.periodo), "dd/MM"),
    total: d.total,
  }));
  const isEmpty = chartData.every((d) => d.total === 0);

  return (
    <ChartCard
      title="Uploads por semana (últimas 12 semanas)"
      icon={<CalendarClock className="h-4 w-4 text-primary" />}
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
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={36}>
            <LabelList
              dataKey="total"
              position="top"
              formatter={(v: number) => (v > 0 ? v : "")}
              style={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
