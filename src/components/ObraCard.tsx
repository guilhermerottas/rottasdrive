import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Trash2, ChevronRight, Pencil } from "lucide-react";
import { Obra, useDeleteObra } from "@/hooks/useObras";
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
import { EditObraDialog } from "./EditObraDialog";

interface ObraCardProps {
  obra: Obra;
}

export function ObraCard({ obra }: ObraCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteObra = useDeleteObra();

  const handleDelete = async () => {
    try {
      await deleteObra.mutateAsync(obra.id);
      toast.success("Obra excluída com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir obra");
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all overflow-hidden">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {obra.foto_url ? (
            <img 
              src={obra.foto_url} 
              alt={obra.nome} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/10">
              <Building2 className="h-16 w-16 text-primary/50" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/obra/${obra.id}`} className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate hover:text-primary transition-colors">
                {obra.nome}
              </h3>
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Obra?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá excluir a obra "{obra.nome}" e todos os seus arquivos e pastas. Esta ação não pode ser desfeita.
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
          </div>
          {obra.endereco && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {obra.endereco}
            </p>
          )}
        </div>
      </Card>

      <EditObraDialog open={editOpen} onOpenChange={setEditOpen} obra={obra} />
    </>
  );
}
