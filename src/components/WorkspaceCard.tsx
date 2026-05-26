import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, MoreVertical } from "lucide-react";
import { Workspace, useDeleteWorkspace } from "@/hooks/useWorkspaces";
import { getWorkspaceIcon } from "./workspaceIcons";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditWorkspaceDialog } from "./EditWorkspaceDialog";
import { useAuthContext } from "@/components/AuthProvider";

interface WorkspaceCardProps {
  workspace: Workspace;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteWorkspace = useDeleteWorkspace();
  const { isAdmin } = useAuthContext();

  const accent = workspace.cor || "hsl(var(--primary))";
  const WorkspaceIcon = getWorkspaceIcon(workspace.icone);

  const handleDelete = async () => {
    try {
      await deleteWorkspace.mutateAsync(workspace.id);
      toast.success("Workspace excluído com sucesso!");
    } catch {
      toast.error("Erro ao excluir workspace");
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all overflow-hidden">
        <Link
          to={`/workspace/${workspace.id}`}
          className="block aspect-[4/3] overflow-hidden cursor-pointer relative"
          style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}0d)` }}
        >
          <div className="h-full w-full flex items-center justify-center">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
              style={{ backgroundColor: `${accent}26` }}
            >
              <WorkspaceIcon className="h-10 w-10" style={{ color: accent }} />
            </div>
          </div>
        </Link>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/workspace/${workspace.id}`} className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate text-foreground">
                {workspace.nome}
              </h3>
            </Link>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {workspace.obras_count ?? 0}{" "}
            {(workspace.obras_count ?? 0) === 1 ? "coleção" : "coleções"}
          </p>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir o workspace "{workspace.nome}". Não é possível excluir um
              workspace que ainda tem coleções vinculadas — mova ou exclua as
              coleções antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditWorkspaceDialog open={editOpen} onOpenChange={setEditOpen} workspace={workspace} />
    </>
  );
}
