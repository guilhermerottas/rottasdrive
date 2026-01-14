import { AppLayout } from "@/components/layout/AppLayout";
import { useTrashArquivos, useRestoreArquivo, useDeletePermanently, useEmptyTrash } from "@/hooks/useArquivos";
import { TrashArquivoItem } from "@/components/TrashArquivoItem";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
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

export default function Lixeira() {
  const { data: trashArquivos, isLoading } = useTrashArquivos();
  const restoreArquivo = useRestoreArquivo();
  const deletePermanently = useDeletePermanently();
  const emptyTrash = useEmptyTrash();

  const handleRestore = async (id: string) => {
    try {
      await restoreArquivo.mutateAsync({ id });
      toast.success("Arquivo restaurado com sucesso!");
    } catch (error) {
      toast.error("Erro ao restaurar arquivo");
    }
  };

  const handleDeletePermanently = async (id: string, arquivoUrl: string) => {
    try {
      await deletePermanently.mutateAsync({ id, arquivoUrl });
      toast.success("Arquivo excluído permanentemente!");
    } catch (error) {
      toast.error("Erro ao excluir arquivo");
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash.mutateAsync();
      toast.success("Lixeira esvaziada com sucesso!");
    } catch (error) {
      toast.error("Erro ao esvaziar lixeira");
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trash2 className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold">Lixeira</h1>
              <p className="text-muted-foreground text-sm">
                Arquivos excluídos são removidos permanentemente após 30 dias
              </p>
            </div>
          </div>

          {trashArquivos && trashArquivos.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Esvaziar Lixeira
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Esvaziar Lixeira?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá excluir permanentemente todos os {trashArquivos.length} arquivo(s) da lixeira. 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEmptyTrash}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Esvaziar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !trashArquivos || trashArquivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trash2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">A lixeira está vazia</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Arquivos excluídos aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {trashArquivos.map((arquivo) => (
              <TrashArquivoItem
                key={arquivo.id}
                arquivo={arquivo}
                onRestore={() => handleRestore(arquivo.id)}
                onDeletePermanently={() => handleDeletePermanently(arquivo.id, arquivo.arquivo_url)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
