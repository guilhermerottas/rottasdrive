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
import Folder from "@/components/Folder";
import { useAuthContext } from "@/components/AuthProvider";

interface PastaItemProps {
  pasta: Pasta;
}

const folderColors = {
  default: "#f6942a",      // Laranja (PADRÃO)
  yellow: "#f9c75e",       // Amarelo
  blue: "#427bde",         // Azul
  gray: "#53575b",         // Cinza
  orange_dark: "#f67425",  // Laranja escuro
  beige: "#eeeeda",        // Bege claro
};

const colorOptions: { value: PastaColor; label: string; color: string }[] = [
  { value: "default", label: "Laranja", color: "bg-[#f6942a]" },
  { value: "yellow", label: "Amarelo", color: "bg-[#f9c75e]" },
  { value: "blue", label: "Azul", color: "bg-[#427bde]" },
  { value: "gray", label: "Cinza", color: "bg-[#53575b]" },
  { value: "orange_dark", label: "Laranja Escuro", color: "bg-[#f67425]" },
  { value: "beige", label: "Bege", color: "bg-[#eeeeda]" },
];

export function PastaItem({ pasta }: PastaItemProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const deletePasta = useDeletePasta();
  const { canEdit } = useAuthContext();
  const moveArquivo = useMoveArquivo();
  const updateColor = useUpdatePastaColor();

  // Buscar contagem de arquivos na pasta (excluindo arquivos na lixeira)
  const { data: arquivosCount = 0 } = useQuery({
    queryKey: ["arquivos-count", pasta.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("arquivos")
        .select("*", { count: "exact", head: true })
        .eq("pasta_id", pasta.id)
        .is("deleted_at", null);

      if (error) throw error;
      return count || 0;
    },
  });

  const currentColor = (pasta.cor as PastaColor) || "default";
  const folderColor = folderColors[currentColor];

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
      {canEdit && <div className="absolute -top-2 -right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>}

      <Link
        to={`/obra/${pasta.obra_id}/pasta/${pasta.id}`}
        className={cn(
          "flex flex-col items-center justify-center w-full h-full p-4 transition-transform duration-300 ease-out",
          isDragOver ? "scale-105" : "",
          isPressed ? "scale-95" : "hover:-translate-y-2"
        )}
      >
        {/* New Folder Component */}
        <div className="relative flex items-center justify-center mb-2">
          <Folder
            color={folderColor}
            size={1.1}
            className={cn(
              "transition-all",
              isDragOver && "ring-2 ring-white ring-offset-2 rounded-lg"
            )}
          />
        </div>

        {/* Folder Label */}
        <div className="text-center w-full">
          <span className="text-sm font-semibold text-foreground truncate block w-full px-1">
            {pasta.nome}
          </span>
          <span className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
            <FileText className="h-3 w-3" />
            {arquivosCount} {arquivosCount === 1 ? "arquivo" : "arquivos"}
          </span>
        </div>
      </Link>
    </div>
  );
}
