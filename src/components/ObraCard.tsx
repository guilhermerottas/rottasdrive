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
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <Link to={`/obra/${obra.id}`} className="flex items-center gap-4 flex-1">
            <div className="rounded-lg overflow-hidden bg-primary/10 flex-shrink-0 flex items-center justify-center" style={{ width: 100, height: 100 }}>
              {obra.foto_url ? (
                <img 
                  src={obra.foto_url} 
                  alt={obra.nome} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{obra.nome}</CardTitle>
              {obra.endereco && (
                <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                  {obra.endereco}
                </CardDescription>
              )}
              {obra.descricao && (
                <CardDescription className="mt-0.5 line-clamp-1">
                  {obra.descricao}
                </CardDescription>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                setEditOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
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
        </CardHeader>
      </Card>

      <EditObraDialog open={editOpen} onOpenChange={setEditOpen} obra={obra} />
    </>
  );
}
