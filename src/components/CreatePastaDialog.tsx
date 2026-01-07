import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus } from "lucide-react";
import { useCreatePasta } from "@/hooks/usePastas";
import { toast } from "sonner";

interface CreatePastaDialogProps {
  obraId: string;
  pastaPaiId?: string | null;
}

export function CreatePastaDialog({ obraId, pastaPaiId }: CreatePastaDialogProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const createPasta = useCreatePasta();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    try {
      await createPasta.mutateAsync({
        nome: nome.trim(),
        obraId,
        pastaPaiId,
      });
      toast.success("Pasta criada com sucesso!");
      setNome("");
      setOpen(false);
    } catch (error) {
      toast.error("Erro ao criar pasta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderPlus className="mr-2 h-4 w-4" />
          Nova Pasta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Pasta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Pasta</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Documentos"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={createPasta.isPending}>
            {createPasta.isPending ? "Criando..." : "Criar Pasta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
