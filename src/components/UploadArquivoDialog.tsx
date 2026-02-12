import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileUp } from "lucide-react";
import { useUpload } from "@/contexts/UploadContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface UploadArquivoDialogProps {
  obraId: string;
  pastaId?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function UploadArquivoDialog({
  obraId,
  pastaId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true
}: UploadArquivoDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [files, setFiles] = useState<File[]>([]);
  const [descricoes, setDescricoes] = useState<Record<number, string>>({});
  const { addUploads } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setDescricoes({});
    }
  };

  const handleDescricaoChange = (index: number, value: string) => {
    setDescricoes(prev => ({ ...prev, [index]: value }));
  };

  const handleUpload = () => {
    if (files.length === 0) return;

    addUploads(files, obraId, pastaId, descricoes);

    toast.success(`${files.length} arquivo(s) adicionado(s) à fila de upload.`);
    setFiles([]);
    setDescricoes({});
    setOpen(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Arquivos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Clique para selecionar ou arraste arquivos aqui
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {files.map((file, i) => (
                <div key={i} className="p-3 bg-muted rounded space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 font-medium">{file.name}</span>
                    <span className="text-muted-foreground ml-2">{formatSize(file.size)}</span>
                  </div>
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={descricoes[i] || ""}
                    onChange={(e) => handleDescricaoChange(i, e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleUpload}
            className="w-full"
            disabled={files.length === 0}
          >
            Enviar {files.length > 0 ? `${files.length} arquivo(s)` : ''} em segundo plano
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
