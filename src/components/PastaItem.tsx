import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
  variant?: "documents" | "photos" | "videos" | "music" | "default";
}

const folderVariants = {
  documents: {
    backColor: "bg-[#4DB8FF]",
    frontGradient: "bg-gradient-to-br from-white to-[#E6F7FF]",
    shadow: "shadow-[0_8px_24px_rgba(77,184,255,0.3)]",
    tabColor: "bg-[#4DB8FF]",
  },
  photos: {
    backColor: "bg-[#34C759]",
    frontGradient: "bg-gradient-to-br from-white to-[#E8F8EC]",
    shadow: "shadow-[0_8px_24px_rgba(52,199,89,0.3)]",
    tabColor: "bg-[#34C759]",
  },
  videos: {
    backColor: "bg-[#FFB800]",
    frontGradient: "bg-gradient-to-br from-white to-[#FFF8E6]",
    shadow: "shadow-[0_8px_24px_rgba(255,184,0,0.3)]",
    tabColor: "bg-[#FFB800]",
  },
  music: {
    backColor: "bg-[#9747FF]",
    frontGradient: "bg-gradient-to-br from-white to-[#F3E8FF]",
    shadow: "shadow-[0_8px_24px_rgba(151,71,255,0.3)]",
    tabColor: "bg-[#9747FF]",
  },
  default: {
    backColor: "bg-primary",
    frontGradient: "bg-gradient-to-br from-white to-primary-light",
    shadow: "shadow-[0_8px_24px_rgba(244,155,11,0.3)]",
    tabColor: "bg-primary",
  },
};

export function PastaItem({ pasta, variant = "default" }: PastaItemProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const deletePasta = useDeletePasta();
  const moveArquivo = useMoveArquivo();

  const styles = folderVariants[variant];

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
      className="group relative w-[180px] h-[160px] cursor-pointer"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {/* Delete Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 z-20 h-8 w-8 rounded-full bg-card border border-border opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-destructive hover:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4" />
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

      <Link
        to={`/obra/${pasta.obra_id}/pasta/${pasta.id}`}
        className={cn(
          "block w-full h-full transition-transform duration-300 ease-out",
          isDragOver ? "scale-105" : "",
          isPressed ? "scale-95" : "hover:-translate-y-2"
        )}
      >
        {/* Folder Structure */}
        <div className="relative w-full h-[120px]">
          {/* Folder Tab */}
          <div 
            className={cn(
              "absolute -top-2 right-5 w-[60px] h-[20px] rounded-t-lg z-0",
              styles.tabColor
            )}
          />
          
          {/* Folder Back */}
          <div 
            className={cn(
              "absolute top-0 right-0 w-[150px] h-[100px] rounded-2xl z-[1]",
              styles.backColor,
              styles.shadow,
              isDragOver && "ring-2 ring-white ring-offset-2"
            )}
          />
          
          {/* Folder Front (Glassmorphism) */}
          <div 
            className={cn(
              "absolute top-5 left-0 w-[160px] h-[90px] rounded-2xl z-[2] border-[3px] border-white",
              styles.frontGradient,
              "backdrop-blur-sm",
              "shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            )}
          >
            {/* Glass Shine Effect */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
            </div>
          </div>
        </div>

        {/* Folder Label */}
        <div className="absolute bottom-0 left-0 right-0 text-center px-2">
          <span className="text-sm font-semibold text-foreground truncate block">
            {pasta.nome}
          </span>
        </div>
      </Link>
    </div>
  );
}
