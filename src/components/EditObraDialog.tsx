import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, X } from "lucide-react";
import { useUpdateObra, Obra } from "@/hooks/useObras";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditObraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra: Obra;
}

export function EditObraDialog({ open, onOpenChange, obra }: EditObraDialogProps) {
  const [nome, setNome] = useState(obra.nome);
  const [descricao, setDescricao] = useState(obra.descricao || "");
  const [endereco, setEndereco] = useState(obra.endereco || "");
  const [fotoPreview, setFotoPreview] = useState<string | null>(obra.foto_url);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateObra = useUpdateObra();

  useEffect(() => {
    if (open) {
      setNome(obra.nome);
      setDescricao(obra.descricao || "");
      setEndereco(obra.endereco || "");
      setFotoPreview(obra.foto_url);
      setFotoFile(null);
    }
  }, [open, obra]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione uma imagem");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNome = nome.trim();
    
    if (!trimmedNome) {
      toast.error("O nome é obrigatório");
      return;
    }

    if (trimmedNome.length > 100) {
      toast.error("O nome deve ter no máximo 100 caracteres");
      return;
    }

    try {
      await updateObra.mutateAsync({ 
        id: obra.id,
        nome: trimmedNome, 
        descricao: descricao.trim() || undefined,
        endereco: endereco.trim() || undefined,
        foto: fotoFile || undefined,
        currentFotoUrl: fotoFile ? obra.foto_url : (fotoPreview ? obra.foto_url : null)
      });
      toast.success("Obra atualizada com sucesso!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao atualizar obra");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Obra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Foto de Perfil</Label>
            <div className="flex items-center gap-4">
              <div 
                className={cn(
                  "relative h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors",
                  fotoPreview ? "border-transparent" : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {fotoPreview ? (
                  <>
                    <img src={fotoPreview} alt="Preview" className="h-full w-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFoto();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Clique para selecionar uma foto</p>
                <p>JPG, PNG até 5MB</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Obra *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Edifício Central"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex: Rua das Flores, 123 - Centro"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição da obra..."
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={updateObra.isPending}>
              {updateObra.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
