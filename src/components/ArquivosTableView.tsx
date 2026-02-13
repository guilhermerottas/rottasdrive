import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuthContext } from "@/components/AuthProvider";

interface ArquivosTableViewProps {
  arquivos: Arquivo[];
  obraId: string;
  onView: (arquivo: Arquivo) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

const getFileIcon = (tipo: string | null) => {
  if (!tipo) return File;
  if (tipo.startsWith("image/")) return FileImage;
  if (tipo.startsWith("video/")) return FileVideo;
  if (tipo.startsWith("audio/")) return FileAudio;
  if (tipo.includes("pdf") || tipo.includes("document") || tipo.includes("text")) return FileText;
  return File;
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " bytes";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
};

const formatTipo = (tipo: string | null) => {
  if (!tipo) return "-";
  
  const tipoMap: Record<string, string> = {
    "image/jpeg": "Imagem JPEG",
    "image/jpg": "Imagem JPEG",
    "image/png": "Imagem PNG",
    "image/gif": "Imagem GIF",
    "image/webp": "Imagem WebP",
    "image/svg+xml": "Imagem SVG",
    "video/mp4": "Vídeo MP4",
    "video/webm": "Vídeo WebM",
    "video/avi": "Vídeo AVI",
    "audio/mpeg": "Áudio MP3",
    "audio/mp3": "Áudio MP3",
    "audio/wav": "Áudio WAV",
    "audio/ogg": "Áudio OGG",
    "application/pdf": "Documento PDF",
    "application/msword": "Documento Word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Documento Word",
    "application/vnd.ms-excel": "Planilha Excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Planilha Excel",
    "application/zip": "Arquivo ZIP",
    "application/x-rar-compressed": "Arquivo RAR",
    "text/plain": "Texto",
    "text/csv": "CSV",
    "text/x-python": "Python Script",
    "application/x-python-code": "Python Script",
  };
  
  if (tipoMap[tipo]) return tipoMap[tipo];
  
  // Fallback genérico
  if (tipo.startsWith("image/")) return "Imagem " + tipo.split("/")[1].toUpperCase();
  if (tipo.startsWith("video/")) return "Vídeo " + tipo.split("/")[1].toUpperCase();
  if (tipo.startsWith("audio/")) return "Áudio " + tipo.split("/")[1].toUpperCase();
  if (tipo.startsWith("text/")) return "Texto";
  
  return tipo.split("/")[1]?.toUpperCase() || tipo;
};

function ArquivoTableRow({ arquivo, obraId, onView, isSelected, onToggleSelection }: { arquivo: Arquivo; obraId: string; onView: () => void; isSelected: boolean; onToggleSelection: () => void }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const moveToTrash = useMoveToTrash();
  const { canEdit } = useAuthContext();
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
    } catch {
      toast.error("Erro ao mover arquivo para a lixeira");
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = arquivo.arquivo_url;
    link.download = arquivo.nome;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const formattedDate = format(new Date(arquivo.created_at), "dd 'de' MMM. 'de' yyyy, HH:mm", { locale: ptBR });

  return (
    <>
      <TableRow 
        className={cn(
          "cursor-pointer hover:bg-muted/50 transition-colors group",
          isSelected && "bg-primary/5"
        )}
        onClick={onView}
      >
        <TableCell className="py-2 w-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection()}
          />
        </TableCell>
        <TableCell className="py-2">
          <div className="flex items-center gap-3">
            {isImage ? (
              <img
                src={arquivo.arquivo_url}
                alt={arquivo.nome}
                className="h-8 w-8 object-cover rounded flex-shrink-0"
              />
            ) : (
              <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <span className="truncate font-medium max-w-[300px]">{arquivo.nome}</span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground whitespace-nowrap">
          {formatSize(arquivo.tamanho)}
        </TableCell>
        <TableCell className="text-muted-foreground whitespace-nowrap">
          {formatTipo(arquivo.tipo)}
        </TableCell>
        <TableCell className="text-muted-foreground whitespace-nowrap">
          {formattedDate}
        </TableCell>
        <TableCell className="text-muted-foreground whitespace-nowrap">
          {arquivo.uploader?.nome || "-"}
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleToggleFavorito}
            >
              <Star className={cn("h-4 w-4", isFavorito ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleFavorito}>
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
                {canEdit && (
                  <>
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
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

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

export function ArquivosTableView({ arquivos, obraId, onView, selectedIds, onToggleSelection, onSelectAll, onClearSelection }: ArquivosTableViewProps) {
  const allSelected = arquivos.length > 0 && arquivos.every(a => selectedIds.has(a.id));
  const someSelected = arquivos.some(a => selectedIds.has(a.id));

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectAll();
                  } else {
                    onClearSelection();
                  }
                }}
                className={someSelected && !allSelected ? "opacity-50" : ""}
              />
            </TableHead>
            <TableHead className="font-semibold">Nome</TableHead>
            <TableHead className="font-semibold whitespace-nowrap">Tamanho</TableHead>
            <TableHead className="font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold whitespace-nowrap">Data da Adição</TableHead>
            <TableHead className="font-semibold whitespace-nowrap">Enviado por</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {arquivos.map((arquivo) => (
            <ArquivoTableRow
              key={arquivo.id}
              arquivo={arquivo}
              obraId={obraId}
              onView={() => onView(arquivo)}
              isSelected={selectedIds.has(arquivo.id)}
              onToggleSelection={() => onToggleSelection(arquivo.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
