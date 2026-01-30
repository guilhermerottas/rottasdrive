import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/components/AuthProvider";
import { useAdminUsers, UserWithProfile } from "@/hooks/useAdminUsers";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteUserDialog } from "@/components/InviteUserDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, UserPlus, Crown, Edit, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppRole } from "@/hooks/useAuth";

const roleLabels: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  admin: { label: "Administrador", icon: Crown, color: "bg-amber-500" },
  editor: { label: "Editor", icon: Edit, color: "bg-blue-500" },
  viewer: { label: "Visualizador", icon: Eye, color: "bg-gray-500" },
  user: { label: "Usuário", icon: Eye, color: "bg-gray-500" },
};

const Admin = () => {
  const { isAdmin, user, loading: authLoading } = useAuthContext();
  const { users, isLoading, updateUserRole } = useAdminUsers();
  const [searchValue, setSearchValue] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  // Wait for auth to load before checking permissions
  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredUsers = users?.filter((u) =>
    u.nome?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    // Prevent admin from changing their own role
    if (userId === user?.id) {
      return;
    }
    updateUserRole.mutate({ userId, newRole });
  };

  const getRoleBadge = (role: AppRole) => {
    const config = roleLabels[role];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AppLayout>
      <AppHeader 
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-muted-foreground text-sm">
                Gerencie usuários e permissões do sistema
              </p>
            </div>
          </div>
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Convidar Usuário
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users?.filter((u) => u.role === "admin").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Administradores</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users?.filter((u) => u.role === "editor").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Editores</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users?.filter((u) => u.role === "viewer").length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Visualizadores</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Usuários ({users?.length || 0})</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Nível Atual</TableHead>
                  <TableHead>Data de Registro</TableHead>
                  <TableHead>Alterar Nível</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((userItem) => (
                  <TableRow key={userItem.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={userItem.avatar_url || undefined} />
                          <AvatarFallback>
                            {userItem.nome?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{userItem.nome || "Sem nome"}</p>
                          {userItem.email && (
                            <p className="text-xs text-muted-foreground">{userItem.email}</p>
                          )}
                          {userItem.user_id === user?.id && (
                            <p className="text-xs text-muted-foreground">(Você)</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(userItem.role)}</TableCell>
                    <TableCell>
                      {format(new Date(userItem.created_at), "dd 'de' MMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      {userItem.user_id === user?.id ? (
                        <span className="text-sm text-muted-foreground">
                          Não é possível alterar seu próprio nível
                        </span>
                      ) : (
                        <Select
                          value={userItem.role}
                          onValueChange={(value) =>
                            handleRoleChange(userItem.user_id, value as AppRole)
                          }
                          disabled={updateUserRole.isPending}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-amber-500" />
                                Administrador
                              </div>
                            </SelectItem>
                            <SelectItem value="editor">
                              <div className="flex items-center gap-2">
                                <Edit className="h-4 w-4 text-blue-500" />
                                Editor
                              </div>
                            </SelectItem>
                            <SelectItem value="viewer">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-gray-500" />
                                Visualizador
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      </div>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </AppLayout>
  );
};

export default Admin;
