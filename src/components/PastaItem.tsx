import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trash2, Palette, FileText } from "lucide-react";
import { Pasta, PastaColor, useDeletePasta, useUpdatePastaColor } from "@/hooks/usePastas";
import { useMoveArquivo } from "@/hooks/useArquivos";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PastaItemProps {
  pasta: Pasta;
}

const folderVariants = {
  documents: {
    bodyGradient: "bg-gradient-to-br from-[#B3E0FF] via-[#7EC8FF] to-[#4A9EFF]",
    tabGradient: "bg-gradient-to-b from-[#4A9EFF] to-[#3B8FEF]",
    shadow: "shadow-[0_8px_24px_rgba(74,158,255,0.35)]",
    bottomGlow: "bg-[radial-gradient(ellipse,rgba(74,158,255,0.4)_0%,transparent_70%)]",
  },
  photos: {
    bodyGradient: "bg-gradient-to-br from-[#99E6A3] via-[#66D97E] to-[#34C759]",
    tabGradient: "bg-gradient-to-b from-[#34C759] to-[#2DB84E]",
    shadow: "shadow-[0_8px_24px_rgba(52,199,89,0.35)]",
    bottomGlow: "bg-[radial-gradient(ellipse,rgba(52,199,89,0.4)_0%,transparent_70%)]",
  },
  videos: {
    bodyGradient: "bg-gradient-to-br from-[#FFDB66] via-[#FFC933] to-[#FFB800]",
    tabGradient: "bg-gradient-to-b from-[#FFB800] to-[#E5A600]",
    shadow: "shadow-[0_8px_24px_rgba(255,184,0,0.35)]",
    bottomGlow: "bg-[radial-gradient(ellipse,rgba(255,184,0,0.4)_0%,transparent_70%)]",
  },
  music: {
    bodyGradient: "bg-gradient-to-br from-[#D4B8FF] via-[#B88CFF] to-[#9747FF]",
    tabGradient: "bg-gradient-to-b from-[#9747FF] to-[#8840E5]",
    shadow: "shadow-[0_8px_24px_rgba(151,71,255,0.35)]",
    bottomGlow: "bg-[radial-gradient(ellipse,rgba(151,71,255,0.4)_0%,transparent_70%)]",
  },
  default: {
    bodyGradient: "bg-gradient-to-br from-[#FAC771] via-[#F7B13E] to-[#F49B0B]",
    tabGradient: "bg-gradient-to-b from-[#F49B0B] to-[#D68609]",
    shadow: "shadow-[0_8px_24px_rgba(244,155,11,0.35)]",
    bottomGlow: "bg-[radial-gradient(ellipse,rgba(244,155,11,0.4)_0%,transparent_70%)]",
  },
};

const colorOptions: { value: PastaColor; label: string; color: string }[] = [
  { value: "default", label: "Laranja", color: "bg-primary" },
  { value: "documents", label: "Azul", color: "bg-[#4DB8FF]" },
  { value: "photos", label: "Verde", color: "bg-[#34C759]" },
  { value: "videos", label: "Amarelo", color: "bg-[#FFB800]" },
  { value: "music", label: "Roxo", color: "bg-[#9747FF]" },
];

export function PastaItem({ pasta }: PastaItemProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const deletePasta = useDeletePasta();
  const moveArquivo = useMoveArquivo();
  const updateColor = useUpdatePastaColor();

  // Buscar contagem de arquivos na pasta
  const { data: arquivosCount = 0 } = useQuery({
    queryKey: ["arquivos-count", pasta.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("arquivos")
        .select("*", { count: "exact", head: true })
        .eq("pasta_id", pasta.id);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const currentColor = (pasta.cor as PastaColor) || "default";
  const styles = folderVariants[currentColor];

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
      {/* Action Buttons */}
      <div className="absolute -top-2 -right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Color Picker */}
        <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-card border border-border shadow-sm hover:bg-accent"
              onClick={(e) => e.stopPropagation()}
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                    option.color,
                    currentColor === option.value ? "border-foreground ring-2 ring-offset-2 ring-foreground" : "border-white"
                  )}
                  title={option.label}
                  onClick={() => {
                    updateColor.mutate({ id: pasta.id, cor: option.value });
                    setColorPickerOpen(false);
                  }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-card border border-border shadow-sm hover:bg-destructive hover:text-white"
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
      </div>

      <Link
        to={`/obra/${pasta.obra_id}/pasta/${pasta.id}`}
        className={cn(
          "block w-full h-full transition-transform duration-300 ease-out",
          isDragOver ? "scale-105" : "",
          isPressed ? "scale-95" : "hover:-translate-y-2"
        )}
      >
        {/* Folder Structure */}
        <div className="relative w-[140px] h-[100px] mx-auto">
          {/* Bottom Shadow/Glow */}
          <div 
            className={cn(
              "absolute -bottom-1 left-[10px] right-[10px] h-2 blur-[4px] z-0",
              styles.bottomGlow
            )}
          />
          
          {/* Folder Tab */}
          <div 
            className={cn(
              "absolute top-0 left-6 w-[50px] h-4 rounded-t-lg z-[1]",
              styles.tabGradient,
              "shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]"
            )}
          />
          
          {/* Folder Body */}
          <div 
            className={cn(
              "absolute top-3 left-0 w-[140px] h-[90px] rounded-[10px] z-[2] overflow-hidden",
              styles.bodyGradient,
              styles.shadow,
              "shadow-[inset_0_2px_8px_rgba(255,255,255,0.4),inset_0_-2px_8px_rgba(0,0,0,0.1)]",
              isDragOver && "ring-2 ring-white ring-offset-2"
            )}
          >
            {/* Glass Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent z-[3]" />
            
            {/* Gloss Effect */}
            <div className="absolute top-2 left-2 right-2 h-[30px] bg-gradient-to-b from-white/60 to-transparent rounded-[6px] z-[4]" />
          </div>
        </div>

        {/* Folder Label */}
        <div className="absolute bottom-0 left-0 right-0 text-center px-2">
          <span className="text-sm font-semibold text-foreground truncate block">
            {pasta.nome}
          </span>
          <span className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
            <FileText className="h-3 w-3" />
            {arquivosCount} {arquivosCount === 1 ? "arquivo" : "arquivos"}
          </span>
        </div>
      </Link>
    </div>
  );
}
