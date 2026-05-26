import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/components/AuthProvider";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteUserDialog } from "@/components/InviteUserDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
"@/components/ui/alert-dialog";
import { Shield, Users, UserPlus, Crown, Edit, Eye, Ban, UserCheck, BarChart3, FolderKanban, Upload } from "lucide-react";
import { WorkspacesAdminTab } from "@/components/admin/WorkspacesAdminTab";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppRole } from "@/hooks/useAuth";
import { AccessByDayChart } from "@/components/admin/AccessByDayChart";
import { UploadsByMonthChart } from "@/components/admin/UploadsByMonthChart";
import { UploadsByWeekChart } from "@/components/admin/UploadsByWeekChart";
import { AdminUploadsTab } from "@/components/admin/AdminUploadsTab";
import { TopFoldersChart } from "@/components/admin/TopFoldersChart";
import { HeaviestFilesTable } from "@/components/admin/HeaviestFilesTable";

const roleLabels: Record<string, {label: string;icon: typeof Crown;color: string;}> = {
  admin: { label: "Administrador", icon: Crown, color: "bg-amber-500" },
  editor: { label: "Editor", icon: Edit, color: "bg-blue-500" },
  viewer: { label: "Visualizador", icon: Eye, color: "bg-gray-500" },
  user: { label: "Usuário", icon: Eye, color: "bg-gray-500" }
};

const CargoCell = ({
  userId,
  cargo,
  onSave,
  disabled,
}: {
  userId: string;
  cargo: string | null;
  onSave: (userId: string, cargo: string | null) => void;
  disabled?: boolean;
}) => {
  const [value, setValue] = useState(cargo ?? "");

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const trimmed = value.trim();
        if (trimmed !== (cargo ?? "")) {
          onSave(userId, trimmed || null);
        }
      }}
      placeholder="Cargo"
      className="h-9 w-44"
      disabled={disabled} />);

};

const Admin = () => {
  const { isAdmin, user, loading: authLoading } = useAuthContext();
  const { users, isLoading, updateUserRole, updateUserCargo, blockUser } = useAdminUsers();
  const [searchValue, setSearchValue] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [blockAction, setBlockAction] = useState<"block" | "unblock">("block");
  const [searchParams, setSearchParams] = useSearchParams();
  const TABS_VALIDOS = ["usuarios", "workspaces", "uploads", "metricas"] as const;
  const tabParam = searchParams.get("tab");
  const currentTab = (TABS_VALIDOS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as string)
    : "usuarios";
  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", value);
      return next;
    }, { replace: true });
  };

  // Wait for auth to load before checking permissions
  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>);

  }

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
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

  const handleBlockClick = (userId: string, action: "block" | "unblock") => {
    setSelectedUserId(userId);
    setBlockAction(action);
    setBlockConfirmOpen(true);
  };

  const handleConfirmBlock = () => {
    if (selectedUserId) {
      blockUser.mutate({ userId: selectedUserId, action: blockAction });
    }
    setBlockConfirmOpen(false);
    setSelectedUserId(null);
  };

  const getRoleBadge = (role: AppRole) => {
    const config = roleLabels[role];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>);

  };

  const selectedUser = users?.find((u) => u.user_id === selectedUserId);

  return (
    <AppLayout>
      <AppHeader
        searchValue={searchValue}
        onSearchChange={setSearchValue} />


      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-muted-foreground text-sm">
                Gerencie usuários, permissões e acompanhe as métricas do sistema
              </p>
            </div>
          </div>
          <Button onClick={() => setInviteOpen(true)} className="gap-2 w-full sm:w-auto shrink-0">
            <UserPlus className="h-4 w-4" />
            convidar
          </Button>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6 grid grid-cols-2 gap-1 h-auto w-full sm:inline-flex sm:h-10 sm:w-auto sm:gap-0">
            <TabsTrigger value="usuarios" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="workspaces" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Workspaces
            </TabsTrigger>
            <TabsTrigger value="uploads" className="gap-2">
              <Upload className="h-4 w-4" />
              Uploads
            </TabsTrigger>
            <TabsTrigger value="metricas" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Métricas
            </TabsTrigger>
          </TabsList>

          {/* ===================== ABA USUÁRIOS ===================== */}
          <TabsContent value="usuarios" className="mt-0 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-card border border-border rounded-xl p-4 cursor-help">
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
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Acesso total ao sistema. Podem gerenciar usuários, permissões,
                  workspaces e ver o painel administrativo.
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-card border border-border rounded-xl p-4 cursor-help">
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
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Podem criar, renomear e excluir obras, pastas e arquivos
                  apenas nos workspaces em que tiverem acesso. Não acessam o
                  painel administrativo.
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-card border border-border rounded-xl p-4 cursor-help">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                        <Eye className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {users?.filter((u) => u.role === "viewer" || u.role as string === "user").length || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Visualizadores</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Só veem o conteúdo dos workspaces dos quais são membros.
                  Não criam, editam nem excluem arquivos.
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-card border border-border rounded-xl p-4 cursor-help">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <Ban className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {users?.filter((u) => u.is_blocked).length || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Bloqueados</p>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Usuários impedidos de acessar a plataforma. Continuam
                  cadastrados, mas o login é recusado até serem desbloqueados.
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Users Table */}
            <div className="bg-card border border-border rounded-xl">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold text-xl">Usuários ({users?.length || 0})</h2>
                </div>
              </div>

              {isLoading ?
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nível Atual</TableHead>
                      <TableHead>Data de Registro</TableHead>
                      <TableHead>Alterar Nível</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3, 4, 5].map((i) =>
                  <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-9 w-44" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-9 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-9 w-28" />
                        </TableCell>
                      </TableRow>
                  )}
                  </TableBody>
                </Table> :
              filteredUsers && filteredUsers.length > 0 ?
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nível Atual</TableHead>
                      <TableHead>Data de Registro</TableHead>
                      <TableHead>Alterar Nível</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userItem) =>
                  <TableRow key={userItem.user_id} className={userItem.is_blocked ? "opacity-60" : ""}>
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
                              {userItem.email &&
                          <p className="text-xs text-muted-foreground">{userItem.email}</p>
                          }
                              {userItem.user_id === user?.id &&
                          <p className="text-xs text-muted-foreground">(Você)</p>
                          }
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <CargoCell
                        userId={userItem.user_id}
                        cargo={userItem.cargo}
                        onSave={(userId, cargo) => updateUserCargo.mutate({ userId, cargo })}
                        disabled={updateUserCargo.isPending} />

                        </TableCell>
                        <TableCell>
                          {userItem.is_blocked ?
                      <Badge variant="destructive" className="gap-1">
                              <Ban className="h-3 w-3" />
                              Bloqueado
                            </Badge> :

                      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                              <UserCheck className="h-3 w-3" />
                              Ativo
                            </Badge>
                      }
                        </TableCell>
                        <TableCell>{getRoleBadge(userItem.role)}</TableCell>
                        <TableCell>
                          {format(new Date(userItem.created_at), "dd 'de' MMM 'de' yyyy", {
                        locale: ptBR
                      })}
                        </TableCell>
                        <TableCell>
                          {userItem.user_id === user?.id ?
                      <span className="text-sm text-muted-foreground">—</span> :
                      userItem.is_blocked ?
                      <span className="text-sm text-muted-foreground">—</span> :

                      <Select
                        value={userItem.role}
                        onValueChange={(value) =>
                        handleRoleChange(userItem.user_id, value as AppRole)
                        }
                        disabled={updateUserRole.isPending}>

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
                      }
                        </TableCell>
                        <TableCell>
                          {userItem.user_id === user?.id ?
                      <span className="text-sm text-muted-foreground">—</span> :
                      userItem.is_blocked ?
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlockClick(userItem.user_id, "unblock")}
                        disabled={blockUser.isPending}
                        className="gap-1">

                              <UserCheck className="h-4 w-4" />
                              Desbloquear
                            </Button> :

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBlockClick(userItem.user_id, "block")}
                        disabled={blockUser.isPending}
                        className="gap-1">

                              <Ban className="h-4 w-4" />
                              Bloquear
                            </Button>
                      }
                        </TableCell>
                      </TableRow>
                  )}
                  </TableBody>
                </Table> :

              <div className="p-8 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                </div>
              }
            </div>
          </TabsContent>

          {/* ===================== ABA WORKSPACES ===================== */}
          <TabsContent value="workspaces" className="mt-0">
            <WorkspacesAdminTab />
          </TabsContent>

          {/* ===================== ABA MÉTRICAS ===================== */}
          <TabsContent value="uploads" className="mt-0">
            <AdminUploadsTab />
          </TabsContent>

          <TabsContent value="metricas" className="mt-0 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AccessByDayChart />
              <UploadsByMonthChart />
              <UploadsByWeekChart />
              <TopFoldersChart />
            </div>
            <HeaviestFilesTable />
          </TabsContent>
        </Tabs>
      </div>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <AlertDialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockAction === "block" ? "Bloquear usuário?" : "Desbloquear usuário?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockAction === "block" ?
              <>
                  O usuário <strong>{selectedUser?.nome}</strong> será deslogado imediatamente
                  e não conseguirá mais acessar a plataforma até ser desbloqueado.
                </> :

              <>
                  O usuário <strong>{selectedUser?.nome}</strong> poderá acessar a plataforma
                  novamente.
                </>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBlock}
              className={blockAction === "block" ? "bg-destructive hover:bg-destructive/90" : ""}>

              {blockAction === "block" ? "Bloquear" : "Desbloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>);

};

export default Admin;
