import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File as FileIconLR,
} from "lucide-react";

export interface PublicArquivoForViewer {
  id: string;
  nome: string;
  tipo: string | null;
  tamanho: number | null;
  url: string | null;
}

interface Props {
  arquivos: PublicArquivoForViewer[];
  index: number | null;
  onIndexChange: (i: number | null) => void;
  permiteDownload: boolean;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function FallbackIcon({ tipo, className = "h-20 w-20" }: { tipo: string | null; className?: string }) {
  const t = tipo || "";
  if (t.startsWith("image/")) return <FileImage className={`${className} text-blue-500`} />;
  if (t.startsWith("video/")) return <FileVideo className={`${className} text-purple-500`} />;
  if (t.startsWith("audio/")) return <FileAudio className={`${className} text-pink-500`} />;
  if (t.includes("pdf") || t.includes("text") || t.includes("document"))
    return <FileText className={`${className} text-red-500`} />;
  return <FileIconLR className={`${className} text-muted-foreground`} />;
}

export function PublicFileViewer({ arquivos, index, onIndexChange, permiteDownload }: Props) {
  const open = index !== null;
  const arquivo = open ? arquivos[index!] : null;
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < arquivos.length - 1;

  const protect = !permiteDownload;

  const renderContent = () => {
    if (!arquivo) return null;
    const tipo = arquivo.tipo || "";
    const url = arquivo.url;

    if (!url) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FallbackIcon tipo={tipo} />
          <p className="mt-3 text-sm">Pré-visualização indisponível</p>
        </div>
      );
    }

    if (tipo.startsWith("image/")) {
      return (
        <img
          src={url}
          alt={arquivo.nome}
          draggable={!protect}
          onDragStart={(e) => {
            if (protect) e.preventDefault();
          }}
          style={
            protect
              ? ({
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  WebkitUserDrag: "none",
                  WebkitTouchCallout: "none",
                } as React.CSSProperties)
              : undefined
          }
          className="max-w-full max-h-[75vh] object-contain rounded-lg mx-auto"
        />
      );
    }

    if (tipo === "application/pdf") {
      return (
        <iframe
          src={url}
          title={arquivo.nome}
          className="w-full h-[75vh] rounded-lg border bg-white"
        />
      );
    }

    if (tipo.startsWith("video/")) {
      return (
        <video
          src={url}
          controls
          controlsList={protect ? "nodownload noplaybackrate" : undefined}
          disablePictureInPicture={protect}
          className="max-w-full max-h-[75vh] mx-auto rounded-lg bg-black"
        />
      );
    }

    if (tipo.startsWith("audio/")) {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <FallbackIcon tipo={tipo} />
          <audio src={url} controls controlsList={protect ? "nodownload" : undefined} />
        </div>
      );
    }

    // Outros tipos: cartão com nome e (se permitido) baixar
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <FallbackIcon tipo={tipo} />
        <p className="text-sm font-medium">{arquivo.nome}</p>
        <p className="text-xs text-muted-foreground">{formatSize(arquivo.tamanho)}</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onIndexChange(null)}>
      <DialogContent
        className="max-w-5xl p-0 overflow-hidden"
        onContextMenu={(e) => {
          if (protect) e.preventDefault();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b px-4 py-2 bg-background">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" title={arquivo?.nome}>
              {arquivo?.nome}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {arquivo ? `${formatSize(arquivo.tamanho)}` : ""}
              {index !== null && arquivos.length > 1 && (
                <span className="ml-2">
                  {index + 1} / {arquivos.length}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {permiteDownload && arquivo?.url && (
              <a href={arquivo.url} download={arquivo.nome} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-muted/40 p-4 min-h-[40vh] flex items-center justify-center">
          {renderContent()}
        </div>

        {/* Navegação */}
        {arquivos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow-md"
              disabled={!hasPrev}
              onClick={() => hasPrev && onIndexChange(index! - 1)}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow-md"
              disabled={!hasNext}
              onClick={() => hasNext && onIndexChange(index! + 1)}
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
