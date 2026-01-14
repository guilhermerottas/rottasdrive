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
  Share2,
  Mail,
  MessageCircle,
  Link,
  Star,
} from "lucide-react";
import { Arquivo, useMoveToTrash } from "@/hooks/useArquivos";
import { useIsFavorito, useToggleFavorito } from "@/hooks/useFavoritos";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { MoveArquivoDialog } from "./MoveArquivoDialog";
import { RenameArquivoDialog } from "./RenameArquivoDialog";
import { cn } from "@/lib/utils";

interface ArquivoItemProps {
  arquivo: Arquivo;
  obraId: string;
  viewMode: "list" | "grid" | "masonry";
  onView?: () => void;
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

export function ArquivoItem({ arquivo, obraId, viewMode, onView }: ArquivoItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const moveToTrash = useMoveToTrash();
  const { data: isFavorito } = useIsFavorito(arquivo.id);
  const toggleFavorito = useToggleFavorito();
  const Icon = getFileIcon(arquivo.tipo);
  const isImage = arquivo.tipo?.startsWith("image/");

  const handleToggleFavorito = () => {
    toggleFavorito.mutate({ arquivoId: arquivo.id, isFavorito: !!isFavorito });
  };

  const handleMoveToTrash = async () => {
    try {
      await moveToTrash.mutateAsync({ id: arquivo.id });
      toast.success("Arquivo movido para a lixeira!");
    } catch (error) {
      toast.error("Erro ao mover arquivo para a lixeira");
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(arquivo.arquivo_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = arquivo.nome;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify({
      arquivoId: arquivo.id,
      arquivoNome: arquivo.nome,
    }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleShareWhatsApp = () => {
    const url = encodeURIComponent(arquivo.arquivo_url);
    const text = encodeURIComponent(`Confira este arquivo: ${arquivo.nome}`);
    window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Arquivo: ${arquivo.nome}`);
    const body = encodeURIComponent(`Confira este arquivo: ${arquivo.arquivo_url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(arquivo.arquivo_url);
      toast.success("Link copiado para a área de transferência!");
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  // Masonry layout - Pinterest style
  if (viewMode === "masonry") {
    return (
      <>
        <div 
          className="break-inside-avoid mb-4 group relative"
          draggable
          onDragStart={handleDragStart}
        >
          {/* Image/Preview Container */}
          <div 
            className="relative overflow-hidden rounded-2xl bg-muted cursor-pointer"
            onClick={onView}
          >
            {isImage ? (
              <img
                src={arquivo.arquivo_url}
                alt={arquivo.nome}
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="aspect-[4/3] flex items-center justify-center bg-muted">
                <Icon className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            
            {/* Hover overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            
            {/* Favorite button - top left */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute top-2 left-2 h-8 w-8 bg-white/80 backdrop-blur-sm rounded-full transition-opacity",
                isFavorito ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorito();
              }}
            >
              <Star className={cn("h-4 w-4", isFavorito ? "fill-yellow-400 text-yellow-400" : "text-gray-600")} />
            </Button>

            {/* Quick actions - top right */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/80 backdrop-blur-sm rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                <Download className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          </div>
          
          {/* Info below image */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{arquivo.nome}</p>
              <p className="text-xs text-muted-foreground">{formatSize(arquivo.tamanho)}</p>
            </div>
            
            {/* Three dots menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(); }}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleFavorito(); }}>
                  <Star className={cn("mr-2 h-4 w-4", isFavorito && "fill-yellow-400 text-yellow-400")} />
                  {isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={handleShareWhatsApp}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareEmail}>
                      <Mail className="mr-2 h-4 w-4" />
                      E-mail
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Link className="mr-2 h-4 w-4" />
                      Copiar Link
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
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
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mover para Lixeira?</AlertDialogTitle>
              <AlertDialogDescription>
                O arquivo "{arquivo.nome}" será movido para a lixeira e excluído permanentemente após 30 dias.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleMoveToTrash}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Mover para Lixeira
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

  if (viewMode === "grid") {
    return (
      <>
        <div 
          className="group relative flex flex-col items-center p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={onView}
        >
          {/* Favorite button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 left-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorito();
            }}
          >
            <Star
              className={cn(
                "h-4 w-4",
                isFavorito ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              )}
            />
          </Button>

          {/* Dropdown Menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(); }}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleFavorito(); }}>
                  <Star className={cn("mr-2 h-4 w-4", isFavorito && "fill-yellow-400 text-yellow-400")} />
                  {isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={handleShareWhatsApp}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareEmail}>
                      <Mail className="mr-2 h-4 w-4" />
                      E-mail
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Link className="mr-2 h-4 w-4" />
                      Copiar Link
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
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
              <AlertDialogTitle>Mover para Lixeira?</AlertDialogTitle>
              <AlertDialogDescription>
                O arquivo "{arquivo.nome}" será movido para a lixeira e excluído permanentemente após 30 dias.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleMoveToTrash}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Mover para Lixeira
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
        className="group flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={onView}
      >
        <div className="flex-shrink-0">
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
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{arquivo.nome}</p>
          <p className="text-sm text-muted-foreground">{formatSize(arquivo.tamanho)}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleToggleFavorito(); }}>
            <Star className={cn("h-4 w-4", isFavorito ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onView?.(); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={handleShareWhatsApp}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    E-mail
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Link className="mr-2 h-4 w-4" />
                    Copiar Link
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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
            <AlertDialogTitle>Mover para Lixeira?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo "{arquivo.nome}" será movido para a lixeira e excluído permanentemente após 30 dias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMoveToTrash}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Mover para Lixeira
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
