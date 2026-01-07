import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Folder, Trash2 } from "lucide-react";
import { Pasta, useDeletePasta } from "@/hooks/usePastas";
import { useMoveArquivo } from "@/hooks/useArquivos";
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
import { cn } from "@/lib/utils";

interface PastaItemProps {
  pasta: Pasta;
}

export function PastaItem({ pasta }: PastaItemProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const deletePasta = useDeletePasta();
  const moveArquivo = useMoveArquivo();
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      await deletePasta.mutateAsync(pasta.id);
      toast.success("Pasta excluída com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir pasta");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;

      const { arquivoId, arquivoNome } = JSON.parse(data);
      
      await moveArquivo.mutateAsync({ id: arquivoId, pastaId: pasta.id });
      toast.success(`"${arquivoNome}" movido para "${pasta.nome}"`);
    } catch (error) {
      toast.error("Erro ao mover arquivo");
    }
  };

  return (
    <div 
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg border transition-colors",
        isDragOver 
          ? "bg-primary/10 border-primary border-dashed" 
          : "hover:bg-muted/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Link
        to={`/obra/${pasta.obra_id}/pasta/${pasta.id}`}
        className="flex items-center gap-3 flex-1"
      >
        <Folder className={cn(
          "h-8 w-8 transition-colors",
          isDragOver ? "text-primary fill-primary/20" : "text-amber-500 fill-amber-100"
        )} />
        <span className="font-medium">{pasta.nome}</span>
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pasta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir a pasta "{pasta.nome}" e todo seu conteúdo. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
