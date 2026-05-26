import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, LogOut, User, Calendar, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/components/AuthProvider";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileDialog = ({ open, onOpenChange }: UserProfileDialogProps) => {
  const { user, profile, signOut, updateProfile, uploadAvatar } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || "");
      setCargo(profile.cargo || "");
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
    const { error } = await updateProfile({ nome, cargo: cargo.trim() || null });
    if (error) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    } else {
      toast.success("Perfil atualizado!");
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
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
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
                Membro desde{" "}
                {format(new Date(profile.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
          />
        </div>

        {/* Cargo */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Cargo
          </Label>
          <div className="flex gap-2">
            <Input
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex.: Engenheiro Civil"
            />
            <Button onClick={handleUpdateProfile} disabled={loading} size="sm">
              Salvar
            </Button>
          </div>
        </div>

        <Separator />

        <Button variant="destructive" onClick={handleLogout} className="w-full">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </DialogContent>
    </Dialog>
  );
};
