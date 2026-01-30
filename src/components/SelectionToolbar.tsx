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

  const selectedArquivos = arquivos.filter(a => selectedIds.has(a.id));

  const handleDownloadSelected = async () => {
    if (selectedArquivos.length === 0) return;

    setIsDownloading(true);
    toast.info(`Baixando ${selectedArquivos.length} arquivo(s)...`);

    try {
      for (const arquivo of selectedArquivos) {
        const response = await fetch(arquivo.arquivo_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = arquivo.nome;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      toast.success(`${selectedArquivos.length} arquivo(s) baixados com sucesso!`);
      onClearSelection();
    } catch {
      toast.error("Erro ao baixar arquivos");
    } finally {
      setIsDownloading(false);
    }
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-xl shadow-lg px-4 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
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
          <span className="text-sm font-medium">
            {selectedIds.size} selecionado(s)
          </span>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSelected}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? "Baixando..." : "Baixar"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-8 w-8"
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
