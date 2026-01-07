import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRenameArquivo } from "@/hooks/useArquivos";
import { toast } from "sonner";

interface RenameArquivoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arquivoId: string;
  currentName: string;
}

export function RenameArquivoDialog({
  open,
  onOpenChange,
  arquivoId,
  currentName,
}: RenameArquivoDialogProps) {
  const [nome, setNome] = useState(currentName);
  const renameArquivo = useRenameArquivo();

  useEffect(() => {
    if (open) {
      setNome(currentName);
    }
  }, [open, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = nome.trim();

    if (!trimmedName) {
      toast.error("O nome não pode estar vazio");
      return;
    }

    if (trimmedName.length > 255) {
      toast.error("O nome deve ter no máximo 255 caracteres");
      return;
    }

    if (trimmedName === currentName) {
      onOpenChange(false);
      return;
    }

    try {
      await renameArquivo.mutateAsync({ id: arquivoId, nome: trimmedName });
      toast.success("Arquivo renomeado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao renomear arquivo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Renomear Arquivo</DialogTitle>
            <DialogDescription>Digite o novo nome para o arquivo</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do arquivo"
              className="mt-2"
              autoFocus
              maxLength={255}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={renameArquivo.isPending}>
              {renameArquivo.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
