import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Arquivo } from "@/hooks/useArquivos";
import { useIsFavorito, useToggleFavorito } from "@/hooks/useFavoritos";
import { cn } from "@/lib/utils";

interface FileViewerProps {
  arquivo: Arquivo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arquivos?: Arquivo[];
  onNavigate?: (arquivo: Arquivo) => void;
}

export function FileViewer({ arquivo, open, onOpenChange, arquivos = [], onNavigate }: FileViewerProps) {
  const { data: isFavorito } = useIsFavorito(arquivo?.id || "");
  const toggleFavorito = useToggleFavorito();

  if (!arquivo) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = arquivo.arquivo_url;
    link.download = arquivo.nome;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleFavorito = () => {
    toggleFavorito.mutate({ arquivoId: arquivo.id, isFavorito: !!isFavorito });
  };

  const currentIndex = arquivos.findIndex((a) => a.id === arquivo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < arquivos.length - 1;

  const handlePrev = () => {
    if (hasPrev && onNavigate) {
      onNavigate(arquivos[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(arquivos[currentIndex + 1]);
    }
  };

  const renderContent = () => {
    const tipo = arquivo.tipo || "";
    const url = arquivo.arquivo_url;

    if (tipo.startsWith("image/")) {
      return (
        <img
          src={url}
          alt={arquivo.nome}
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
      );
    }

    if (tipo === "application/pdf") {
      return (
        <iframe
          src={url}
          title={arquivo.nome}
          className="w-full h-[70vh] rounded-lg border"
        />
      );
    }

    if (tipo.startsWith("video/")) {
      return (
        <video
          src={url}
          controls
          className="max-w-full max-h-[70vh] rounded-lg"
        >
          Seu navegador não suporta vídeos.
        </video>
      );
    }

    if (tipo.startsWith("audio/")) {
      return (
        <audio src={url} controls className="w-full">
          Seu navegador não suporta áudio.
        </audio>
      );
    }

    // For other file types, show download prompt
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground">
          Este tipo de arquivo não pode ser visualizado diretamente.
        </p>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Baixar arquivo
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="truncate pr-4">{arquivo.nome}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorito}
              disabled={toggleFavorito.isPending}
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  isFavorito ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                )}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex items-center justify-center relative min-h-0 overflow-auto">
          {arquivos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10"
                onClick={handlePrev}
                disabled={!hasPrev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10"
                onClick={handleNext}
                disabled={!hasNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
