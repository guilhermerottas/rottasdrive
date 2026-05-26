import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { FolderKanban, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Workspace,
  useWorkspaces,
  useDeleteWorkspace,
} from "@/hooks/useWorkspaces";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import { EditWorkspaceDialog } from "@/components/EditWorkspaceDialog";
import { getWorkspaceIcon } from "@/components/workspaceIcons";

export function WorkspacesAdminTab() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const deleteWorkspace = useDeleteWorkspace();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Workspace | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWorkspace.mutateAsync(deleteTarget.id);
      toast.success("Workspace excluído!");
    } catch {
      toast.error("Erro ao excluir. Verifique se não há coleções vinculadas.");
    }
    setDeleteTarget(null);
  };

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-xl">Workspaces ({workspaces?.length || 0})</h2>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo Workspace
        </Button>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-24 ml-auto" />
            </div>
          ))
        ) : workspaces && workspaces.length > 0 ? (
          workspaces.map((ws) => {
            const WsIcon = getWorkspaceIcon(ws.icone);
            return (
            <div key={ws.id} className="flex items-center gap-3 p-4">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${ws.cor || "hsl(var(--primary))"}26` }}
              >
                <WsIcon
                  className="h-5 w-5"
                  style={{ color: ws.cor || "hsl(var(--primary))" }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{ws.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {ws.obras_count ?? 0} coleção(ões)
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setEditTarget(ws)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(ws)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum workspace cadastrado</p>
          </div>
        )}
      </div>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <EditWorkspaceDialog
          open={!!editTarget}
          onOpenChange={(o) => !o && setEditTarget(null)}
          workspace={editTarget}
        />
      )}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              O workspace <strong>{deleteTarget?.nome}</strong> será excluído. Workspaces com
              coleções vinculadas não podem ser excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
