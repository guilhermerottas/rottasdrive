import { useState } from "react";
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
import { useCreateWorkspace } from "@/hooks/useWorkspaces";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WORKSPACE_ICONES, WORKSPACE_ICONE_PADRAO } from "./workspaceIcons";

export const WORKSPACE_CORES = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#0ea5e9",
  "#64748b",
];

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState(WORKSPACE_CORES[0]);
  const [icone, setIcone] = useState(WORKSPACE_ICONE_PADRAO);
  const createWorkspace = useCreateWorkspace();

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setCor(WORKSPACE_CORES[0]);
    setIcone(WORKSPACE_ICONE_PADRAO);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNome = nome.trim();

    if (!trimmedNome) {
      toast.error("O nome é obrigatório");
      return;
    }
    if (trimmedNome.length > 100) {
      toast.error("O nome deve ter no máximo 100 caracteres");
      return;
    }

    try {
      await createWorkspace.mutateAsync({
        nome: trimmedNome,
        descricao: descricao.trim() || undefined,
        cor,
        icone,
      });
      toast.success("Workspace criado com sucesso!");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao criar workspace");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
        if (!newOpen) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ws-nome">Nome do Workspace *</Label>
            <Input
              id="ws-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vendas, Marketing, ADM"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ws-descricao">Descrição</Label>
            <Textarea
              id="ws-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do setor..."
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

          <Button type="submit" className="w-full" disabled={createWorkspace.isPending}>
            {createWorkspace.isPending ? "Criando..." : "Criar Workspace"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
