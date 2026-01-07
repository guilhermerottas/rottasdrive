import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, LogOut, UserPlus, User, Mail, Lock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InviteUserDialog } from "./InviteUserDialog";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileDialog = ({ open, onOpenChange }: UserProfileDialogProps) => {
  const { user, profile, isAdmin, signOut, updateProfile, updateEmail, updatePassword, uploadAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || "");
    }
    if (user) {
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setLoading(true);
    const { error } = await uploadAvatar(file);
    if (error) {
      toast.error("Erro ao atualizar foto: " + error.message);
    } else {
      toast.success("Foto atualizada com sucesso!");
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setLoading(true);
    const { error } = await updateProfile({ nome });
    if (error) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    } else {
      toast.success("Perfil atualizado!");
    }
    setLoading(false);
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    setLoading(true);
    const { error } = await updateEmail(email);
    if (error) {
      toast.error("Erro ao atualizar email: " + error.message);
    } else {
      toast.success("Email de confirmação enviado para o novo endereço!");
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(newPassword);
    if (error) {
      toast.error("Erro ao atualizar senha: " + error.message);
    } else {
      toast.success("Senha atualizada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    onOpenChange(false);
    toast.success("Logout realizado com sucesso!");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Meu Perfil</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(profile?.nome)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 p-1.5 bg-background border rounded-full shadow-sm hover:bg-muted"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Registration date */}
            {profile?.created_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Membro desde {format(new Date(profile.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome
            </Label>
            <div className="flex gap-2">
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
              <Button onClick={handleUpdateProfile} disabled={loading} size="sm">
                Salvar
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
              <Button onClick={handleUpdateEmail} disabled={loading} size="sm">
                Salvar
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Alterar Senha
            </Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha"
            />
            <div className="flex gap-2">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar senha"
              />
              <Button onClick={handleUpdatePassword} disabled={loading || !newPassword} size="sm">
                Alterar
              </Button>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {isAdmin && (
              <Button variant="outline" onClick={() => setInviteOpen(true)} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Usuário
              </Button>
            )}
            
            <Button variant="destructive" onClick={handleLogout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
};
