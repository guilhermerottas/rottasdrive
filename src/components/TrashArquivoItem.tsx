import { Button } from "@/components/ui/button";
import {
  FileText,
  FileImage,
  FileVideo,
  File,
  Trash2,
  RotateCcw,
  Clock,
} from "lucide-react";
import { ArquivoWithObra } from "@/hooks/useArquivos";
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
import { useAuthContext } from "@/components/AuthProvider";

interface TrashArquivoItemProps {
  arquivo: ArquivoWithObra;
  onRestore: () => void;
  onDeletePermanently: () => void;
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

const getDaysRemaining = (deletedAt: string | null) => {
  if (!deletedAt) return 30;
  const deletedDate = new Date(deletedAt);
  const expirationDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

const formatDeletedDate = (deletedAt: string | null) => {
  if (!deletedAt) return "";
  const date = new Date(deletedAt);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function TrashArquivoItem({ arquivo, onRestore, onDeletePermanently }: TrashArquivoItemProps) {
  const Icon = getFileIcon(arquivo.tipo);
  const isImage = arquivo.tipo?.startsWith("image/");
  const daysRemaining = getDaysRemaining(arquivo.deleted_at);
  const { canEdit } = useAuthContext();

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      {/* Preview/Icon */}
      <div className="flex-shrink-0">
        {isImage ? (
          <img
            src={arquivo.arquivo_url}
            alt={arquivo.nome}
            className="h-12 w-12 object-cover rounded"
          />
        ) : (
          <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{arquivo.nome}</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{formatSize(arquivo.tamanho)}</span>
          {arquivo.obras?.nome && (
            <>
              <span>•</span>
              <span className="truncate">{arquivo.obras.nome}</span>
            </>
          )}
        </div>
      </div>

      {/* Expiration Info */}
      <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <div className="text-right">
          <p className="text-xs">Excluído em {formatDeletedDate(arquivo.deleted_at)}</p>
          <p className={daysRemaining <= 7 ? "text-destructive font-medium" : ""}>
            {daysRemaining} dia{daysRemaining !== 1 ? "s" : ""} restante{daysRemaining !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRestore}
          className="gap-2"
          disabled={!canEdit}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Restaurar</span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-2" disabled={!canEdit}>
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá excluir permanentemente o arquivo "{arquivo.nome}". 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeletePermanently}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir Permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
