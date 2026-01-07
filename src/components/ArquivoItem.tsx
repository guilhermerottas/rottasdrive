import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileImage,
  FileVideo,
  File,
  Trash2,
  Download,
  Eye,
  MoreVertical,
  FolderInput,
  Pencil,
} from "lucide-react";
import { Arquivo, useDeleteArquivo } from "@/hooks/useArquivos";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoveArquivoDialog } from "./MoveArquivoDialog";
import { RenameArquivoDialog } from "./RenameArquivoDialog";
import { cn } from "@/lib/utils";

interface ArquivoItemProps {
  arquivo: Arquivo;
  obraId: string;
  viewMode: "list" | "grid";
}

const getFileIcon = (tipo: string | null) => {
  if (!tipo) return File;
  if (tipo.startsWith("image/")) return FileImage;
  if (tipo.startsWith("video/")) return FileVideo;
  if (tipo.includes("pdf") || tipo.includes("document") || tipo.includes("text")) return FileText;
  return File;
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export function ArquivoItem({ arquivo, obraId, viewMode }: ArquivoItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const deleteArquivo = useDeleteArquivo();
  const Icon = getFileIcon(arquivo.tipo);
  const isImage = arquivo.tipo?.startsWith("image/");

  const handleDelete = async () => {
    try {
      await deleteArquivo.mutateAsync({ id: arquivo.id, arquivoUrl: arquivo.arquivo_url });
      toast.success("Arquivo excluído com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir arquivo");
    }
  };

  const handleDownload = () => {
    window.open(arquivo.arquivo_url, "_blank");
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify({
      arquivoId: arquivo.id,
      arquivoNome: arquivo.nome,
    }));
    e.dataTransfer.effectAllowed = "move";
  };

  if (viewMode === "grid") {
    return (
      <>
        <div 
          className="group relative flex flex-col items-center p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing"
          draggable
          onDragStart={handleDragStart}
        >
          {/* Dropdown Menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isImage && (
                  <DropdownMenuItem onClick={handleDownload}>
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMoveDialogOpen(true)}>
                  <FolderInput className="mr-2 h-4 w-4" />
                  Mover
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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

          {/* Icon/Preview */}
          <div className="mb-3 pointer-events-none">
            {isImage ? (
              <img
                src={arquivo.arquivo_url}
                alt={arquivo.nome}
                className="h-20 w-20 object-cover rounded"
              />
            ) : (
              <Icon className="h-16 w-16 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <p className="font-medium text-sm text-center truncate w-full">{arquivo.nome}</p>
          <p className="text-xs text-muted-foreground">{formatSize(arquivo.tamanho)}</p>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Arquivo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá excluir o arquivo "{arquivo.nome}". Esta ação não pode ser desfeita.
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

        <MoveArquivoDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          arquivoId={arquivo.id}
          arquivoNome={arquivo.nome}
          obraId={obraId}
          currentPastaId={arquivo.pasta_id}
        />

        <RenameArquivoDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          arquivoId={arquivo.id}
          currentName={arquivo.nome}
        />
      </>
    );
  }

  return (
    <>
      <div 
        className="group flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing"
        draggable
        onDragStart={handleDragStart}
      >
        <div className="flex-shrink-0 pointer-events-none">
          {isImage ? (
            <img
              src={arquivo.arquivo_url}
              alt={arquivo.nome}
              className="h-10 w-10 object-cover rounded"
            />
          ) : (
            <Icon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0 pointer-events-none">
          <p className="font-medium truncate">{arquivo.nome}</p>
          <p className="text-sm text-muted-foreground">{formatSize(arquivo.tamanho)}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isImage && (
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMoveDialogOpen(true)}>
                <FolderInput className="mr-2 h-4 w-4" />
                Mover para...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Arquivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir o arquivo "{arquivo.nome}". Esta ação não pode ser desfeita.
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

      <MoveArquivoDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        arquivoId={arquivo.id}
        arquivoNome={arquivo.nome}
        obraId={obraId}
        currentPastaId={arquivo.pasta_id}
      />

      <RenameArquivoDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        arquivoId={arquivo.id}
        currentName={arquivo.nome}
      />
    </>
  );
}
