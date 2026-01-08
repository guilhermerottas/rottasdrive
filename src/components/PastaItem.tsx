import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, MoreVertical, Pencil, Palette, Trash2, Check } from "lucide-react";
import { Pasta, PastaColor, useDeletePasta, useUpdatePastaColor, useRenamePasta } from "@/hooks/usePastas";
import { useMoveArquivo } from "@/hooks/useArquivos";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PastaItemProps {
  pasta: Pasta;
  fileCount?: number;
}

const colorOptions: { value: PastaColor; label: string; color: string; bgLight: string }[] = [
  { value: "blue", label: "Azul", color: "bg-[#4A9EFF]", bgLight: "bg-[#E8F4FF]" },
  { value: "purple", label: "Roxo", color: "bg-[#9747FF]", bgLight: "bg-[#F3E8FF]" },
  { value: "green", label: "Verde", color: "bg-[#34C759]", bgLight: "bg-[#E8F8EC]" },
  { value: "yellow", label: "Amarelo", color: "bg-[#FFB800]", bgLight: "bg-[#FFF8E6]" },
  { value: "default", label: "Laranja", color: "bg-[#F49B0B]", bgLight: "bg-[#FFF4E6]" },
  { value: "red", label: "Vermelho", color: "bg-[#FF3B30]", bgLight: "bg-[#FFE8E6]" },
  { value: "pink", label: "Rosa", color: "bg-[#FF2D92]", bgLight: "bg-[#FFE8F4]" },
];

const getColorStyles = (cor: PastaColor) => {
  const option = colorOptions.find(o => o.value === cor) || colorOptions[4]; // default to orange
  return option;
};

export function PastaItem({ pasta, fileCount = 0 }: PastaItemProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newName, setNewName] = useState(pasta.nome);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const deletePasta = useDeletePasta();
  const moveArquivo = useMoveArquivo();
  const updateColor = useUpdatePastaColor();
  const renamePasta = useRenamePasta();

  const currentColor = (pasta.cor as PastaColor) || "default";
  const colorStyle = getColorStyles(currentColor);

  useEffect(() => {
    if (showRenameDialog && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showRenameDialog]);

  const handleDelete = async () => {
    try {
      await deletePasta.mutateAsync(pasta.id);
      toast.success("Pasta excluída com sucesso!");
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error("Erro ao excluir pasta");
    }
  };

  const handleRename = async () => {
    if (!newName.trim()) {
      toast.error("Nome da pasta não pode ser vazio");
      return;
    }
    try {
      await renamePasta.mutateAsync({ id: pasta.id, nome: newName.trim() });
      toast.success("Pasta renomeada com sucesso!");
      setShowRenameDialog(false);
    } catch (error) {
      toast.error("Erro ao renomear pasta");
    }
  };

  const handleColorChange = (cor: PastaColor) => {
    updateColor.mutate({ id: pasta.id, cor });
    setShowColorPicker(false);
    toast.success("Cor alterada!");
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
    <>
      <div 
        className={cn(
          "group relative bg-card rounded-xl p-4 border border-border transition-all duration-200 cursor-pointer",
          "hover:shadow-lg hover:-translate-y-0.5",
          isDragOver && "ring-2 ring-primary border-primary shadow-lg"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          {/* Folder Icon + Link */}
          <Link
            to={`/obra/${pasta.obra_id}/pasta/${pasta.id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div 
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                colorStyle.bgLight
              )}
            >
              <Folder 
                className="w-5 h-5" 
                style={{ color: colorStyle.color.replace("bg-[", "").replace("]", "") }}
                fill="currentColor"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold text-foreground truncate">
                {pasta.nome}
              </h3>
              <p className="text-[13px] text-muted-foreground">
                {fileCount} {fileCount === 1 ? "arquivo" : "arquivos"}
              </p>
            </div>
          </Link>

          {/* Menu Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  setNewName(pasta.nome);
                  setShowRenameDialog(true);
                }}
              >
                <Pencil className="h-4 w-4 mr-3" />
                Renomear
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
              >
                <Palette className="h-4 w-4 mr-3" />
                Mudar Cor
              </DropdownMenuItem>

              {showColorPicker && (
                <div className="px-3 py-2 flex flex-wrap gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      className={cn(
                        "w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 flex items-center justify-center",
                        option.color,
                        currentColor === option.value 
                          ? "border-foreground" 
                          : "border-transparent"
                      )}
                      title={option.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleColorChange(option.value);
                      }}
                    >
                      {currentColor === option.value && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-3" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pasta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir a pasta "{pasta.nome}" e todo seu conteúdo. 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear Pasta</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da pasta"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRename}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
