import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import Grainient from "@/components/Grainient";
import { CheckCircle, Loader2, Camera, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const GrainientBackground = () => (
  <div className="absolute inset-0 z-0">
    <Grainient
      color1="#f2930d"
      color2="#ffd294"
      color3="#fcb045"
      timeSpeed={0.25}
      colorBalance={0}
      warpStrength={1}
      warpFrequency={5}
      warpSpeed={2}
      warpAmplitude={50}
      blendAngle={0}
      blendSoftness={0.05}
      rotationAmount={500}
      noiseScale={2}
      grainAmount={0.1}
      grainScale={2}
      grainAnimated={false}
      contrast={1.5}
      gamma={1}
      saturation={1}
      centerX={0}
      centerY={0}
      zoom={0.9}
    />
  </div>
);

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  // Invite registration state
  const [inviteStep, setInviteStep] = useState<"validate" | "register" | "profile" | "done">("validate");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [invitePasswordConfirm, setInvitePasswordConfirm] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteAvatarFile, setInviteAvatarFile] = useState<File | null>(null);
  const [inviteAvatarPreview, setInviteAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [validatingInvite, setValidatingInvite] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast.error("Erro ao fazer login: " + error.message);
    } else {
      toast.success("Login realizado com sucesso!");
      navigate("/");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      recoveryEmail,
      { redirectTo: `${window.location.origin}/auth` }
    );

    if (error) {
      toast.error("Erro ao enviar email: " + error.message);
    } else {
      toast.success("Email enviado! Verifique sua caixa de entrada.");
      setShowForgotPassword(false);
      setRecoveryEmail("");
    }
    setLoading(false);
  };

  const handleValidateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidatingInvite(true);

    try {
      const { data: invite, error } = await supabase
        .from("invites")
        .select("*")
        .eq("token", inviteToken!)
        .eq("email", inviteEmail.trim().toLowerCase())
        .eq("status", "pending")
        .single();

      if (error || !invite) {
        toast.error("Convite inválido ou email não corresponde ao convite.");
        setValidatingInvite(false);
        return;
      }

      if (new Date(invite.expires_at) < new Date()) {
        toast.error("Este convite expirou. Solicite um novo convite ao administrador.");
        setValidatingInvite(false);
        return;
      }

      setInviteStep("register");
    } catch {
      toast.error("Erro ao validar convite.");
    }
    setValidatingInvite(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (invitePassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (invitePassword !== invitePasswordConfirm) {
      toast.error("As senhas não coincidem.");
      return;
    }

    // Move to profile step
    setInviteStep("profile");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB.");
        return;
      }
      setInviteAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setInviteAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFinishProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteName.trim()) {
      toast.error("O nome é obrigatório.");
      return;
    }

    setLoading(true);

    try {
      // Create user via edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke("invite-signup", {
        body: {
          email: inviteEmail.trim().toLowerCase(),
          password: invitePassword,
          token: inviteToken!,
          nome: inviteName.trim(),
        },
      });

      if (fnError || fnData?.error) {
        toast.error("Erro ao criar conta: " + (fnData?.error || fnError?.message));
        setLoading(false);
        return;
      }

      // Sign in immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: inviteEmail.trim().toLowerCase(),
        password: invitePassword,
      });

      if (signInError) {
        toast.error("Conta criada, mas erro ao fazer login: " + signInError.message);
        setLoading(false);
        setInviteStep("done");
        setTimeout(() => navigate("/auth"), 2000);
        return;
      }

      // Upload avatar if provided
      if (inviteAvatarFile && signInData.user) {
        const fileExt = inviteAvatarFile.name.split(".").pop();
        const fileName = `${signInData.user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, inviteAvatarFile, { upsert: true });

        if (!uploadError) {
          const { data: publicUrl } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);

          await supabase
            .from("profiles")
            .update({ avatar_url: `${publicUrl.publicUrl}?t=${Date.now()}` })
            .eq("user_id", signInData.user.id);
        }
      }

      setInviteStep("done");
      toast.success("Conta criada com sucesso!");
      setTimeout(() => navigate("/"), 1500);
    } catch {
      toast.error("Erro ao criar conta.");
    }
    setLoading(false);
  };

  // Render invite flow
  if (inviteToken) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <GrainientBackground />
        <Card className="w-full max-w-md relative z-10 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Logo" style={{ width: 60, height: 60 }} />
            </div>
            <CardTitle className="text-2xl">
              {inviteStep === "done" ? "Conta Criada!" : inviteStep === "profile" ? "Configure seu Perfil" : "Criar Conta"}
            </CardTitle>
            <CardDescription>
              {inviteStep === "validate" && "Insira seu email para validar o convite"}
              {inviteStep === "register" && "Defina sua senha para continuar"}
              {inviteStep === "profile" && "Informe seu nome e foto de perfil"}
              {inviteStep === "done" && "Você será redirecionado em instantes..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inviteStep === "done" ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-sm text-muted-foreground text-center">
                  Sua conta foi criada com sucesso. Redirecionando...
                </p>
              </div>
            ) : inviteStep === "validate" ? (
              <form onSubmit={handleValidateInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Seu Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use o mesmo email para o qual o convite foi enviado.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={validatingInvite}>
                  {validatingInvite ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    "Validar Convite"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Já tenho conta, fazer login
                </button>
              </form>
            ) : inviteStep === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={inviteEmail} disabled className="opacity-70" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-password">Senha</Label>
                  <Input
                    id="invite-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-password-confirm">Confirmar Senha</Label>
                  <Input
                    id="invite-password-confirm"
                    type="password"
                    placeholder="Repita a senha"
                    value={invitePasswordConfirm}
                    onChange={(e) => setInvitePasswordConfirm(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Continuar
                </Button>
                <button
                  type="button"
                  onClick={() => setInviteStep("validate")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Voltar
                </button>
              </form>
            ) : inviteStep === "profile" ? (
              <form onSubmit={handleFinishProfile} className="space-y-6">
                {/* Avatar upload */}
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Avatar className="h-24 w-24 border-2 border-dashed border-muted-foreground/30 group-hover:border-primary transition-colors">
                      {inviteAvatarPreview ? (
                        <AvatarImage src={inviteAvatarPreview} alt="Preview" />
                      ) : (
                        <AvatarFallback className="bg-muted">
                          <User className="h-10 w-10 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md">
                      <Camera className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Foto de perfil (opcional)
                  </p>
                </div>

                {/* Name input */}
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Nome *</Label>
                  <Input
                    id="invite-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Finalizar Cadastro"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setInviteStep("register")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Voltar
                </button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render normal login
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <GrainientBackground />
      <Card className="w-full max-w-md relative z-10 shadow-2xl backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Logo" style={{ width: 60, height: 60 }} />
          </div>
          <CardTitle className="text-2xl">Armazenamento Rottas</CardTitle>
          <CardDescription>
            {showForgotPassword ? "Recuperar sua senha" : "Faça login para continuar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-email">Email</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de reset"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setRecoveryEmail("");
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar para login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Esqueci minha senha →
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
