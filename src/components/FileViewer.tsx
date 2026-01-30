import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Star, ChevronLeft, ChevronRight, User, Calendar, HardDrive, FileType, Building2, Info } from "lucide-react";
import { Arquivo } from "@/hooks/useArquivos";
import { useIsFavorito, useToggleFavorito } from "@/hooks/useFavoritos";
import { useObra } from "@/hooks/useObras";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface FileViewerProps {
  arquivo: Arquivo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arquivos?: Arquivo[];
  onNavigate?: (arquivo: Arquivo) => void;
}

const formatSize = (bytes: number | null) => {
  if (!bytes) return "Desconhecido";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
};

const formatFileType = (tipo: string | null) => {
  if (!tipo) return "Desconhecido";
  if (tipo.startsWith("image/")) return tipo.replace("image/", "").toUpperCase();
  if (tipo.startsWith("video/")) return tipo.replace("video/", "").toUpperCase();
  if (tipo.startsWith("audio/")) return tipo.replace("audio/", "").toUpperCase();
  if (tipo === "application/pdf") return "PDF";
  return tipo.split("/").pop()?.toUpperCase() || tipo;
};

export function FileViewer({ arquivo, open, onOpenChange, arquivos = [], onNavigate }: FileViewerProps) {
  const { data: isFavorito } = useIsFavorito(arquivo?.id || "");
  const toggleFavorito = useToggleFavorito();
  const { data: obra } = useObra(arquivo?.obra_id || "");
  const [showInfo, setShowInfo] = useState(false);

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
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
          <DialogTitle className="truncate pr-4">{arquivo.nome}</DialogTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInfo(!showInfo)}
              className={cn(showInfo && "bg-muted")}
            >
              <Info className="h-5 w-5" />
            </Button>
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

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 flex items-center justify-center relative overflow-auto p-4">
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

          {/* Info sidebar */}
          {showInfo && (
            <div className="w-72 border-l bg-muted/30 p-4 overflow-auto">
              <h3 className="font-semibold mb-4">Informações do arquivo</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Enviado por</p>
                    <p className="text-sm font-medium">{arquivo.uploader?.nome || "Desconhecido"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Obra</p>
                    <p className="text-sm font-medium">{obra?.nome || "Carregando..."}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data de upload</p>
                    <p className="text-sm font-medium">
                      {format(new Date(arquivo.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(arquivo.created_at), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <HardDrive className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tamanho</p>
                    <p className="text-sm font-medium">{formatSize(arquivo.tamanho)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileType className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Formato</p>
                    <p className="text-sm font-medium">{formatFileType(arquivo.tipo)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
