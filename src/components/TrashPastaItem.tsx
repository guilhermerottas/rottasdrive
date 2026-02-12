import { Button } from "@/components/ui/button";
import { Folder, Trash2, RotateCcw, Clock } from "lucide-react";
import { PastaWithObra } from "@/hooks/usePastas";
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

interface TrashPastaItemProps {
  pasta: PastaWithObra;
  onRestore: () => void;
  onDeletePermanently: () => void;
}

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

export function TrashPastaItem({ pasta, onRestore, onDeletePermanently }: TrashPastaItemProps) {
  const daysRemaining = getDaysRemaining(pasta.deleted_at);
  const { canEdit } = useAuthContext();

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className="h-12 w-12 flex items-center justify-center bg-muted rounded">
          <Folder className="h-6 w-6 text-muted-foreground fill-current" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{pasta.nome}</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Pasta</span>
          {pasta.obras?.nome && (
            <>
              <span>•</span>
              <span className="truncate">{pasta.obras.nome}</span>
            </>
          )}
        </div>
      </div>

      {/* Expiration Info */}
      <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <div className="text-right">
          <p className="text-xs">Excluída em {formatDeletedDate(pasta.deleted_at)}</p>
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
              <AlertDialogTitle>Excluir Pasta Permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá excluir permanentemente a pasta "{pasta.nome}" e todo seu conteúdo.
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
