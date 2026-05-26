import { useState } from "react";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Cite } from "@/lib/chatStream";
import { resolveArquivoUrl } from "@/lib/storage";

interface Props {
  citacoes: Cite[];
}

export default function ChatCitations({ citacoes }: Props) {
  const [opening, setOpening] = useState<string | null>(null);

  if (!citacoes || citacoes.length === 0) return null;

  const handleClick = async (c: Cite) => {
    setOpening(c.arquivo_id);
    try {
      const { data, error } = await supabase
        .from("arquivos")
        .select("arquivo_url")
        .eq("id", c.arquivo_id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error || !data?.arquivo_url) {
        toast.error("Arquivo não disponível");
        return;
      }
      const signed = await resolveArquivoUrl(data.arquivo_url);
      if (!signed) {
        toast.error("Arquivo não disponível");
        return;
      }
      window.open(signed, "_blank", "noopener,noreferrer");
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {citacoes.map((c, i) => {
        const isLoading = opening === c.arquivo_id;
        return (
          <button
            key={`${c.arquivo_id}-${c.page_number ?? "_"}-${i}`}
            type="button"
            onClick={() => handleClick(c)}
            disabled={isLoading}
            className="inline-flex items-center gap-1 max-w-[220px] rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
            title={c.nome}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            ) : (
              <FileText className="h-3 w-3 shrink-0" />
            )}
            <span className="truncate">
              {c.nome}
              {c.page_number != null && (
                <span className="text-muted-foreground/70"> · p.{c.page_number}</span>
              )}
            </span>
            <ExternalLink className="h-2.5 w-2.5 opacity-60 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
