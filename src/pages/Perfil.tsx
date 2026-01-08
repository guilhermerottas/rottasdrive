import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, User, Mail, Lock, LogOut } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function Perfil() {
  const { user, profile, signOut, updateProfile, updateEmail, updatePassword, uploadAvatar } = useAuth();
  const [nome, setNome] = useState(profile?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ nome });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    setSaving(true);
    try {
      await updateEmail(email);
      toast.success("E-mail de confirmação enviado!");
    } catch (error) {
      toast.error("Erro ao atualizar e-mail");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setSaving(true);
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      toast.success("Senha atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar senha");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      await uploadAvatar(file);
      toast.success("Foto atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar foto");
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.nome
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <AppLayout>
      <AppHeader searchValue="" onSearchChange={() => {}} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Meu Perfil</h1>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
              </div>
              <Button onClick={handleUpdateProfile} disabled={saving}>
                Salvar Nome
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                E-mail
              </CardTitle>
              <CardDescription>Altere seu endereço de e-mail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <Button onClick={handleUpdateEmail} disabled={saving}>
                Atualizar E-mail
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Senha
              </CardTitle>
              <CardDescription>Altere sua senha de acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <Button onClick={handleUpdatePassword} disabled={saving}>
                Atualizar Senha
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <LogOut className="h-5 w-5" />
                Sair da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={signOut}>
                Sair
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
