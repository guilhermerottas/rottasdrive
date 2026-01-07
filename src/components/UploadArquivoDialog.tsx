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
import { useUploadArquivo } from "@/hooks/useArquivos";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface UploadArquivoDialogProps {
  obraId: string;
  pastaId?: string | null;
}

export function UploadArquivoDialog({ obraId, pastaId }: UploadArquivoDialogProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadArquivo = useUploadArquivo();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        await uploadArquivo.mutateAsync({
          file: files[i],
          obraId,
          pastaId,
        });
        setProgress(((i + 1) / files.length) * 100);
      }
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`);
      setFiles([]);
      setOpen(false);
    } catch (error) {
      toast.error("Erro ao enviar arquivo(s)");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </DialogTrigger>
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
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-muted-foreground ml-2">{formatSize(file.size)}</span>
                </div>
              ))}
            </div>
          )}

          {uploading && <Progress value={progress} />}

          <Button
            onClick={handleUpload}
            className="w-full"
            disabled={files.length === 0 || uploading}
          >
            {uploading ? `Enviando... ${Math.round(progress)}%` : `Enviar ${files.length} arquivo(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
