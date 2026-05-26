import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Lock, Globe, Copy, Download, ClipboardCheck, MessageCircle, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Pasta } from "@/hooks/usePastas";
import {
  publicShareUrl,
  usePastaCompartilhamento,
  useSetPastaCompartilhamento,
} from "@/hooks/usePastaCompartilhamento";

interface CompartilharPastaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pasta: Pasta;
}

export function CompartilharPastaDialog({ open, onOpenChange, pasta }: CompartilharPastaDialogProps) {
  const { data: share, isLoading } = usePastaCompartilhamento(pasta.id, open);
  const setShare = useSetPastaCompartilhamento();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const isPublic = !!share?.ativo;
  const link = share ? publicShareUrl(share.short_code) : "";

  useEffect(() => {
    if (isPublic && link) {
      QRCode.toDataURL(link, { width: 320, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [isPublic, link]);

  const ativar = (permiteDownload: boolean) => {
    setShare.mutate(
      { pastaId: pasta.id, ativo: true, permiteDownload },
      { onError: (e: any) => toast.error("Erro: " + e.message) }
    );
  };

  const desativar = () => {
    setShare.mutate(
      { pastaId: pasta.id, ativo: false, permiteDownload: share?.permite_download ?? false },
      {
        onSuccess: () => toast.success("Compartilhamento desativado."),
        onError: (e: any) => toast.error("Erro: " + e.message),
      }
    );
  };

  const setDownload = (permiteDownload: boolean) => {
    setShare.mutate(
      { pastaId: pasta.id, ativo: true, permiteDownload },
      { onError: (e: any) => toast.error("Erro: " + e.message) }
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const copyTexto = () => {
    const msg = `Acesse a pasta "${pasta.nome}" pelo link: ${link}`;
    navigator.clipboard.writeText(msg);
    toast.success("Texto copiado!");
  };

  const baixarQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode-${pasta.nome}.png`;
    a.click();
  };

  const compartilharWhatsApp = () => {
    const msg = `Acesse a pasta "${pasta.nome}" pelo link: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar pasta</DialogTitle>
          <DialogDescription>{pasta.nome}</DialogDescription>
        </DialogHeader>

        {/* Opções Privado / Link público */}
        <div className="space-y-2">
          <button
            type="button"
            disabled={setShare.isPending || isLoading}
            onClick={() => isPublic && desativar()}
            className={cn(
              "w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              !isPublic ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            )}
          >
            <Lock className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Privado</p>
              <p className="text-xs text-muted-foreground">
                Só você e quem já tem acesso à pasta.
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={setShare.isPending || isLoading}
            onClick={() => !isPublic && ativar(false)}
            className={cn(
              "w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              isPublic ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            )}
          >
            <Globe className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Link público</p>
              <p className="text-xs text-muted-foreground">
                Qualquer pessoa com o link, sem precisar logar.
              </p>
            </div>
          </button>
        </div>

        {isPublic && (
          <div className="space-y-3">
            {/* Permissão do link */}
            <RadioGroup
              value={share?.permite_download ? "download" : "ver"}
              onValueChange={(v) => setDownload(v === "download")}
              className="grid grid-cols-2 gap-2"
            >
              <Label
                htmlFor="op-ver"
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-sm",
                  !share?.permite_download && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="ver" id="op-ver" />
                Só ver
              </Label>
              <Label
                htmlFor="op-download"
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-sm",
                  share?.permite_download && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="download" id="op-download" />
                Ver e baixar
              </Label>
            </RadioGroup>

            {/* QR Code */}
            {qrDataUrl && (
              <div className="flex justify-center">
                <img
                  src={qrDataUrl}
                  alt="QR Code do link"
                  className="h-48 w-48 rounded-lg border"
                />
              </div>
            )}

            {/* Link */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Link público</Label>
              <div className="flex gap-2">
                <Input readOnly value={link} className="text-xs" />
                <Button variant="outline" size="icon" onClick={copyLink} title="Copiar link">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={baixarQR} disabled={!qrDataUrl}>
                <Download className="mr-2 h-4 w-4" />
                Baixar QR
              </Button>
              <Button variant="outline" size="sm" onClick={copyTexto}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Texto pronto
              </Button>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={compartilharWhatsApp}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Compartilhar no WhatsApp
            </Button>

            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              onClick={desativar}
              disabled={setShare.isPending}
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Desativar compartilhamento
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Qualquer pessoa com o link acessa esse conjunto de arquivos. Para revogar, mude
              para Privado.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
