import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  icon?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
  children: ReactNode;
}

/** Wrapper padrão de card de gráfico (design system de gráficos do Rottas Control). */
export function ChartCard({
  title,
  icon,
  isLoading,
  isEmpty,
  emptyLabel = "Sem dados para exibir",
  className,
  children,
}: ChartCardProps) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 h-full flex flex-col ${className ?? ""}`}>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {isLoading ? (
        <Skeleton className="flex-1 min-h-[260px] w-full" />
      ) : isEmpty ? (
        <div className="flex-1 min-h-[260px] flex items-center justify-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex-1 min-h-[260px]">{children}</div>
      )}
    </div>
  );
}

/** Tooltip custom padrão dos gráficos. */
export function ChartTip({
  active,
  payload,
  label,
  valueLabel = "Total",
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  valueLabel?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {valueLabel}: <span className="font-semibold text-foreground">{payload[0].value}</span>
      </p>
    </div>
  );
}
