import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Users } from "lucide-react";
import { Workspace, useUpdateWorkspace } from "@/hooks/useWorkspaces";
import { WORKSPACE_CORES } from "./CreateWorkspaceDialog";
import { WORKSPACE_ICONES, WORKSPACE_ICONE_PADRAO } from "./workspaceIcons";
import { WorkspaceMembrosLista } from "./WorkspaceMembrosLista";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
}

export function EditWorkspaceDialog({ open, onOpenChange, workspace }: EditWorkspaceDialogProps) {
  const [nome, setNome] = useState(workspace.nome);
  const [descricao, setDescricao] = useState(workspace.descricao || "");
  const [cor, setCor] = useState(workspace.cor || WORKSPACE_CORES[0]);
  const [icone, setIcone] = useState(workspace.icone || WORKSPACE_ICONE_PADRAO);
  const updateWorkspace = useUpdateWorkspace();

  useEffect(() => {
    if (open) {
      setNome(workspace.nome);
      setDescricao(workspace.descricao || "");
      setCor(workspace.cor || WORKSPACE_CORES[0]);
      setIcone(workspace.icone || WORKSPACE_ICONE_PADRAO);
    }
  }, [open, workspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNome = nome.trim();

    if (!trimmedNome) {
      toast.error("O nome é obrigatório");
      return;
    }

    try {
      await updateWorkspace.mutateAsync({
        id: workspace.id,
        nome: trimmedNome,
        descricao: descricao.trim() || undefined,
        cor,
        icone,
      });
      toast.success("Workspace atualizado!");
      onOpenChange(false);
    } catch {
      toast.error("Erro ao atualizar workspace");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>Editar Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto px-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ews-nome">Nome do Workspace *</Label>
            <Input
              id="ews-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ews-descricao">Descrição</Label>
            <Textarea
              id="ews-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-transform",
                    cor === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(WORKSPACE_ICONES).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcone(key)}
                  className={cn(
                    "h-10 w-10 rounded-lg border flex items-center justify-center transition-colors",
                    icone === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                  style={icone === key ? { borderColor: cor, color: cor, backgroundColor: `${cor}1a` } : undefined}
                  aria-label={`Ícone ${key}`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Quem tem acesso
            </Label>
            <p className="text-xs text-muted-foreground">
              Marque os usuários que podem acessar este workspace. Admins e Editores têm
              acesso total.
            </p>
            <WorkspaceMembrosLista workspaceId={workspace.id} enabled={open} />
          </div>
          </div>

          <div className="px-6 py-4 border-t border-border flex-shrink-0">
            <Button type="submit" className="w-full" disabled={updateWorkspace.isPending}>
              {updateWorkspace.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
