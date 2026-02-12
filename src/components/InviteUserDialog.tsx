import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Send, Copy, Check, Link } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InviteUserDialog = ({ open, onOpenChange }: InviteUserDialogProps) => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    setLoading(true);
    setInviteLink(null);

    try {
      const { data: invite, error: dbError } = await supabase
        .from("invites")
        .insert({
          email: email.trim(),
          invited_by: user?.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const link = `${window.location.origin}/auth?invite=${invite.token}`;

      // Try sending email, but don't block on failure
      try {
        const { error: emailError } = await supabase.functions.invoke("send-invite", {
          body: {
            email: email.trim(),
            token: invite.token,
            inviterName: user?.email,
          },
        });

        if (emailError) {
          setInviteLink(link);
          toast.info("Convite criado! Copie o link abaixo e envie manualmente.");
        } else {
          toast.success("Convite enviado por email com sucesso!");
          setEmail("");
          onOpenChange(false);
        }
      } catch {
        setInviteLink(link);
        toast.info("Convite criado! Copie o link abaixo e envie manualmente.");
      }
    } catch (error: any) {
      toast.error("Erro ao criar convite: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setInviteLink(null);
      setCopied(false);
      setEmail("");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
          <DialogDescription>
            Envie um convite por email para um novo usuário se cadastrar no sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email do convidado
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!inviteLink}
            />
          </div>

          {!inviteLink && (
            <Button type="submit" className="w-full" disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Enviando..." : "Enviar Convite"}
            </Button>
          )}
        </form>

        {inviteLink && (
          <div className="space-y-3 pt-2">
            <Label className="flex items-center gap-2 text-sm">
              <Link className="h-4 w-4" />
              Link de convite
            </Label>
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="text-xs"
              />
              <Button variant="outline" size="icon" onClick={handleCopy} className="flex-shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copie e envie este link para o usuário criar a conta. O convite expira em 7 dias.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
