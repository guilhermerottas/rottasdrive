import { Button } from "@/components/ui/button";
import { FileText, FileImage, FileVideo, File, Trash2, Download, Eye } from "lucide-react";
import { Arquivo, useDeleteArquivo } from "@/hooks/useArquivos";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ArquivoItemProps {
  arquivo: Arquivo;
}

const getFileIcon = (tipo: string | null) => {
  if (!tipo) return File;
  if (tipo.startsWith("image/")) return FileImage;
  if (tipo.startsWith("video/")) return FileVideo;
  if (tipo.includes("pdf") || tipo.includes("document") || tipo.includes("text")) return FileText;
  return File;
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export function ArquivoItem({ arquivo }: ArquivoItemProps) {
  const deleteArquivo = useDeleteArquivo();
  const Icon = getFileIcon(arquivo.tipo);
  const isImage = arquivo.tipo?.startsWith("image/");

  const handleDelete = async () => {
    try {
      await deleteArquivo.mutateAsync({ id: arquivo.id, arquivoUrl: arquivo.arquivo_url });
      toast.success("Arquivo excluído com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir arquivo");
    }
  };

  const handleDownload = () => {
    window.open(arquivo.arquivo_url, "_blank");
  };

  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0">
        {isImage ? (
          <img
            src={arquivo.arquivo_url}
            alt={arquivo.nome}
            className="h-10 w-10 object-cover rounded"
          />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{arquivo.nome}</p>
        <p className="text-sm text-muted-foreground">{formatSize(arquivo.tamanho)}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isImage && (
          <Button variant="ghost" size="icon" onClick={handleDownload}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Arquivo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá excluir o arquivo "{arquivo.nome}". Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
