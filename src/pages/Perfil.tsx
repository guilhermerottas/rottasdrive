import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuthContext } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Calendar, Shield, Edit } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { UserProfileDialog } from "@/components/UserProfileDialog";

export default function Perfil() {
  const { user, profile, getUserRole } = useAuthContext();
  const [profileOpen, setProfileOpen] = useState(false);

  const role = getUserRole();

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    editor: "Editor",
    viewer: "Visualizador",
    user: "Usuário"
  };

  const initials = profile?.nome
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <AppLayout>
      <AppHeader searchValue="" onSearchChange={() => { }} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Meu Perfil</h1>
            <Button onClick={() => setProfileOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
          </div>

          <Card>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-3xl font-bold">
                {profile?.nome || "Usuário sem nome"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-4">

              <div className="grid gap-4 md:grid-cols-2">
                {/* Email */}
                <div className="flex flex-col space-y-2 p-4 border rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" /> E-mail
                  </span>
                  <span className="font-medium truncate" title={user?.email}>
                    {user?.email}
                  </span>
                </div>

                {/* Nível de Acesso */}
                <div className="flex flex-col space-y-2 p-4 border rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Nível de Acesso
                  </span>
                  <div className="flex">
                    <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {roleLabels[role] || role}
                    </Badge>
                  </div>
                </div>

                {/* Data de Cadastro */}
                <div className="flex flex-col space-y-2 p-4 border rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Desde
                  </span>
                  <span className="font-medium">
                    {profile?.created_at
                      ? format(new Date(profile.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })
                      : "-"
                    }
                  </span>
                </div>

                {/* User ID (Optional/Technical) */}
                <div className="flex flex-col space-y-2 p-4 border rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> ID de Usuário
                  </span>
                  <span className="font-mono text-xs text-muted-foreground truncate" title={user?.id}>
                    {user?.id}
                  </span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>

      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </AppLayout>
  );
}
