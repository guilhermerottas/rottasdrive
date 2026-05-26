import { FileText, FileImage, FileVideo, File, FolderOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileResultRow } from "@/lib/chatStream";
import { resolveArquivoUrl } from "@/lib/storage";
import { toast } from "sonner";

interface Props {
  results: FileResultRow[];
}

function iconFor(tipo: string | null) {
  const t = (tipo ?? "").toLowerCase();
  if (t.startsWith("image/")) return FileImage;
  if (t.startsWith("video/")) return FileVideo;
  if (t.includes("pdf")) return FileText;
  return File;
}

export default function ChatFileResult({ results }: Props) {
  if (!results || results.length === 0) return null;
  return (
    <div className="mt-1.5 space-y-1.5">
      {results.map((r) => {
        const Icon = iconFor(r.tipo);
        const url = r.arquivo_url;
        return (
          <div
            key={r.arquivo_id}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs"
          >
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-foreground">{r.nome}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                <FolderOpen className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {r.obra_nome} · {r.pasta_nome}
                </span>
              </p>
            </div>
            {url && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const signed = await resolveArquivoUrl(url);
                  if (!signed) { toast.error("Arquivo não disponível"); return; }
                  window.open(signed, "_blank", "noopener,noreferrer");
                }}
                className="h-8 gap-1 text-primary hover:bg-primary/10 shrink-0"
              >
                Abrir
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
