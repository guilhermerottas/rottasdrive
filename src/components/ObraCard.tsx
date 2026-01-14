import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Trash2, Pencil, MoreVertical } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditObraDialog } from "./EditObraDialog";

interface ObraCardProps {
  obra: Obra;
}

export function ObraCard({ obra }: ObraCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
        <Link to={`/obra/${obra.id}`} className="block aspect-[4/3] overflow-hidden bg-muted cursor-pointer">
          {obra.foto_url ? (
            <img 
              src={obra.foto_url} 
              alt={obra.nome} 
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <Building2 className="h-16 w-16 text-primary/50" />
            </div>
          )}
        </Link>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/obra/${obra.id}`} className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate hover:text-primary transition-colors">
                {obra.nome}
              </h3>
            </Link>
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
          </div>
          {obra.endereco && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {obra.endereco}
            </p>
          )}
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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

      <EditObraDialog open={editOpen} onOpenChange={setEditOpen} obra={obra} />
    </>
  );
}
