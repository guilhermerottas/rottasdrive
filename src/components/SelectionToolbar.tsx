import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, X, Trash2 } from "lucide-react";
import { Arquivo, useMoveToTrash } from "@/hooks/useArquivos";
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
} from "@/components/ui/alert-dialog";
import { useAuthContext } from "@/components/AuthProvider";

interface SelectionToolbarProps {
  selectedIds: Set<string>;
  arquivos: Arquivo[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  totalCount: number;
}

export function SelectionToolbar({ 
  selectedIds, 
  arquivos, 
  onClearSelection,
  onSelectAll,
  totalCount
}: SelectionToolbarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const moveToTrash = useMoveToTrash();
  const { canEdit } = useAuthContext();

  const selectedArquivos = arquivos.filter(a => selectedIds.has(a.id));

  const handleDownloadSelected = async () => {
    if (selectedArquivos.length === 0) return;

    toast.info(`Baixando ${selectedArquivos.length} arquivo(s)...`);

    for (const arquivo of selectedArquivos) {
      const separator = arquivo.arquivo_url.includes("?") ? "&" : "?";
      const downloadUrl = `${arquivo.arquivo_url}${separator}download=${encodeURIComponent(arquivo.nome)}`;
      window.open(downloadUrl, "_blank");

      // Small delay between downloads to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    toast.success(`${selectedArquivos.length} arquivo(s) baixados com sucesso!`);
    onClearSelection();
  };

  const handleMoveToTrash = async () => {
    try {
      for (const arquivo of selectedArquivos) {
        await moveToTrash.mutateAsync({ id: arquivo.id });
      }
      toast.success(`${selectedArquivos.length} arquivo(s) movido(s) para a lixeira!`);
      onClearSelection();
    } catch {
      toast.error("Erro ao mover arquivos para a lixeira");
    }
  };

  if (selectedIds.size === 0) return null;

  const allSelected = selectedIds.size === totalCount;

  return (
    <>
      <div className="fixed bottom-20 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-50 bg-background border rounded-xl shadow-lg px-3 sm:px-4 py-3 flex items-center justify-between sm:justify-start gap-2 sm:gap-4 animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectAll();
              } else {
                onClearSelection();
              }
            }}
          />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
            {selectedIds.size} selecionado(s)
          </span>
        </div>

        <div className="h-6 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSelected}
            disabled={isDownloading}
            className="h-8 px-2 sm:px-3"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{isDownloading ? "Baixando..." : "Baixar"}</span>
          </Button>

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive hover:text-destructive h-8 px-2 sm:px-3"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-8 w-8 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para Lixeira?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedArquivos.length} arquivo(s) serão movidos para a lixeira e excluídos permanentemente após 30 dias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMoveToTrash}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Mover para Lixeira
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
