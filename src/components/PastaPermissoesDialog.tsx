import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Search, BadgeCheck, Network } from "lucide-react";
import { toast } from "sonner";
import type { Pasta } from "@/hooks/usePastas";
import {
  PastaAcao,
  PASTA_ACOES,
  usePastaPermissoes,
  useSavePastaPermissoes,
} from "@/hooks/usePastaPermissoes";
import { usePastaVinculos } from "@/hooks/usePastaVinculos";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAuthContext } from "@/components/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getWorkspaceIcon } from "@/components/workspaceIcons";
import { PastaWorkspacesTab } from "@/components/PastaWorkspacesTab";

interface PastaPermissoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pasta: Pasta;
}

/** Workspace home da pasta = workspace_id da obra dona. */
function useHomeWorkspaceId(obraId: string | undefined) {
  return useQuery({
    queryKey: ["obra-workspace", obraId],
    enabled: !!obraId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
        .select("workspace_id")
        .eq("id", obraId!)
        .single();
      if (error) throw error;
      return data.workspace_id as string;
    },
  });
}

export function PastaPermissoesDialog({
  open,
  onOpenChange,
  pasta,
}: PastaPermissoesDialogProps) {
  const { isAdmin, hasRole } = useAuthContext();
  const isEditor = hasRole("editor");
  const podeGerenciarVinculos = isAdmin || isEditor;
  const isRoot = pasta.pasta_pai_id === null;

  const { data: homeWorkspaceId } = useHomeWorkspaceId(pasta.obra_id);
  const { data: vinculos } = usePastaVinculos(open ? pasta.id : undefined);
  const { data: allWorkspaces } = useWorkspaces();

  // Lista de workspaces onde a pasta está visível (home + vínculos).
  const workspacesDaPasta = useMemo(() => {
    if (!homeWorkspaceId) return [];
    const ids = new Set<string>([homeWorkspaceId]);
    for (const v of vinculos ?? []) ids.add(v.workspace_destino_id);
    return (allWorkspaces ?? []).filter((w) => ids.has(w.id));
  }, [homeWorkspaceId, vinculos, allWorkspaces]);

  // workspace ativo na matriz de permissões (default: home).
  const [activeWs, setActiveWs] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (open && homeWorkspaceId) setActiveWs(homeWorkspaceId);
  }, [open, homeWorkspaceId]);

  const { data: membros, isLoading } = usePastaPermissoes(
    pasta.id,
    activeWs,
    open
  );
  const savePerms = useSavePastaPermissoes();

  const [search, setSearch] = useState("");
  const [state, setState] = useState<Record<string, Set<PastaAcao>>>({});

  useEffect(() => {
    if (membros) {
      const next: Record<string, Set<PastaAcao>> = {};
      for (const m of membros) next[m.user_id] = new Set(m.acoes);
      setState(next);
    }
  }, [membros]);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggle = (userId: string, acao: PastaAcao, checked: boolean) => {
    setState((prev) => {
      const set = new Set(prev[userId] ?? []);
      if (checked) {
        set.add(acao);
        if (acao !== "ver") set.add("ver");
      } else {
        set.delete(acao);
        if (acao === "ver") set.clear();
      }
      return { ...prev, [userId]: set };
    });
  };

  const filtered = useMemo(
    () =>
      (membros ?? []).filter((m) =>
        (m.nome ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [membros, search]
  );

  const handleSave = async () => {
    if (!membros || !activeWs) return;
    const payload = membros
      .filter((m) => !m.is_gestor)
      .map((m) => ({
        user_id: m.user_id,
        acoes: Array.from(state[m.user_id] ?? new Set<PastaAcao>()),
      }));
    try {
      await savePerms.mutateAsync({
        pastaId: pasta.id,
        workspaceId: activeWs,
        membros: payload,
      });
      toast.success("Permissões salvas!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao salvar permissões: " + err.message);
    }
  };

  const showWorkspaceSelect = workspacesDaPasta.length > 1;
  const showWorkspacesTab = isRoot && podeGerenciarVinculos;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Permissões da pasta
          </DialogTitle>
          <DialogDescription>{pasta.nome}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="permissoes" className="w-full">
          <TabsList className={showWorkspacesTab ? "grid grid-cols-2" : ""}>
            <TabsTrigger value="permissoes">Permissões</TabsTrigger>
            {showWorkspacesTab && (
              <TabsTrigger value="workspaces">
                <Network className="h-4 w-4 mr-1.5" />
                Workspaces
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="permissoes" className="space-y-3 mt-3">
            {showWorkspaceSelect && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Workspace:</span>
                <Select value={activeWs} onValueChange={setActiveWs}>
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="Workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspacesDaPasta.map((w) => {
                      const Icon = getWorkspaceIcon(w.icone);
                      return (
                        <SelectItem key={w.id} value={w.id}>
                          <div className="flex items-center gap-2">
                            <Icon
                              className="h-4 w-4"
                              style={{ color: w.cor ?? undefined }}
                            />
                            <span>{w.nome}</span>
                            {w.id === homeWorkspaceId && (
                              <span className="text-[10px] text-muted-foreground">
                                (origem)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="rounded-lg bg-muted/50 border px-3 py-2 text-xs text-muted-foreground">
              Membros do workspace podem <strong>visualizar e baixar</strong> por
              padrão. Desmarque para remover o acesso de alguém, ou marque ações
              extras (link, adicionar, editar, excluir).
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar membro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[45vh] overflow-auto">
              <div className="grid grid-cols-[1fr_repeat(6,3rem)] items-center gap-1 px-2 pb-2 text-[11px] font-medium text-muted-foreground uppercase border-b">
                <span>Membro</span>
                {PASTA_ACOES.map((a) => (
                  <span key={a.value} className="text-center">
                    {a.label}
                  </span>
                ))}
              </div>

              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((m) => (
                  <div
                    key={m.user_id}
                    className="grid grid-cols-[1fr_repeat(6,3rem)] items-center gap-1 px-2 py-2 border-b last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={m.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(m.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {m.nome || "Sem nome"}
                        </p>
                        {m.is_gestor ? (
                          <p className="text-xs text-primary flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3" />
                            {m.gestor_role === "admin" ? "Admin" : "Editor"} (acesso total)
                          </p>
                        ) : (
                          m.cargo && (
                            <p className="text-xs text-muted-foreground truncate">
                              {m.cargo}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                    {PASTA_ACOES.map((a) => {
                      const checked =
                        m.is_gestor || (state[m.user_id]?.has(a.value) ?? false);
                      return (
                        <div key={a.value} className="flex justify-center">
                          <Checkbox
                            checked={checked}
                            disabled={m.is_gestor || savePerms.isPending}
                            onCheckedChange={(c) =>
                              toggle(m.user_id, a.value, c === true)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhum membro encontrado
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || savePerms.isPending || !activeWs}
              >
                {savePerms.isPending ? "Salvando..." : "Salvar permissões"}
              </Button>
            </DialogFooter>
          </TabsContent>

          {showWorkspacesTab && homeWorkspaceId && (
            <TabsContent value="workspaces" className="mt-3">
              <PastaWorkspacesTab
                pastaId={pasta.id}
                homeWorkspaceId={homeWorkspaceId}
                onClose={() => onOpenChange(false)}
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
