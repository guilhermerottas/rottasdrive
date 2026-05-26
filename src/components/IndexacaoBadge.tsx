import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["status_indexacao"];

interface Props {
  status: Status | null | undefined;
  erro?: string | null;
  className?: string;
  showLabel?: boolean;
}

export function IndexacaoBadge({ status, erro, className, showLabel = false }: Props) {
  if (!status || status === "indexado" || status === "nao_aplicavel") return null;

  const map: Record<Exclude<Status, "indexado" | "nao_aplicavel">, {
    label: string;
    Icon: typeof Sparkles;
    tone: string;
    tooltip: string;
  }> = {
    pendente: {
      label: "Pendente",
      Icon: Sparkles,
      tone: "bg-muted text-muted-foreground border-border",
      tooltip: "Aguardando indexação para o chat",
    },
    processando: {
      label: "Indexando…",
      Icon: Loader2,
      tone: "bg-primary/10 text-primary border-primary/30",
      tooltip: "Extraindo texto e gerando embeddings",
    },
    falhou: {
      label: "Falha",
      Icon: AlertCircle,
      tone: "bg-destructive/10 text-destructive border-destructive/30",
      tooltip: erro ? `Falha na indexação: ${erro}` : "Falha na indexação",
    },
  };

  const cfg = map[status as keyof typeof map];
  if (!cfg) return null;
  const { Icon, label, tone, tooltip } = cfg;

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none",
        tone,
        className,
      )}
    >
      <Icon className={cn("h-3 w-3", status === "processando" && "animate-spin")} />
      {showLabel && <span>{label}</span>}
    </span>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
