import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Send } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InviteUserDialog = ({ open, onOpenChange }: InviteUserDialogProps) => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    setLoading(true);

    try {
      // Create invite in database
      const { data: invite, error: dbError } = await supabase
        .from("invites")
        .insert({
          email: email.trim(),
          invited_by: user?.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Send invite email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-invite", {
        body: {
          email: email.trim(),
          token: invite.token,
          inviterName: user?.email,
        },
      });

      if (emailError) {
        toast.error("Convite criado, mas houve erro ao enviar email. Configure a função de email.");
      } else {
        toast.success("Convite enviado com sucesso!");
        setEmail("");
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error("Erro ao criar convite: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <Send className="h-4 w-4 mr-2" />
            {loading ? "Enviando..." : "Enviar Convite"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
