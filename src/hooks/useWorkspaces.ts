import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Workspace {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
  icone: string | null;
  created_at: string;
  updated_at: string;
  obras_count?: number;
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*, obras(count)")
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((w: any) => ({
        id: w.id,
        nome: w.nome,
        descricao: w.descricao,
        cor: w.cor,
        icone: w.icone ?? null,
        created_at: w.created_at,
        updated_at: w.updated_at,
        obras_count: w.obras?.[0]?.count ?? 0,
      })) as Workspace[];
    },
  });
}

export function useWorkspace(id: string | undefined) {
  return useQuery({
    queryKey: ["workspace", id],
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data as Workspace;
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nome,
      descricao,
      cor,
      icone,
    }: {
      nome: string;
      descricao?: string;
      cor?: string;
      icone?: string;
    }) => {
      const { data, error } = await supabase
        .from("workspaces")
        .insert({ nome, descricao: descricao || null, cor: cor || null, icone: icone || null })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      nome,
      descricao,
      cor,
      icone,
    }: {
      id: string;
      nome: string;
      descricao?: string;
      cor?: string;
      icone?: string;
    }) => {
      const { data, error } = await supabase
        .from("workspaces")
        .update({ nome, descricao: descricao || null, cor: cor || null, icone: icone || null })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", variables.id] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workspaces").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export interface WorkspaceMemberRow {
  user_id: string;
  nome: string | null;
  cargo: string | null;
  avatar_url: string | null;
  is_member: boolean;
  is_gestor: boolean;
  gestor_role: "admin" | "editor" | null;
}

/**
 * Lista todos os usuários do sistema com indicação de quais são membros do workspace.
 * Admins e Editores ("Gestor — acesso total") sempre têm acesso, independente do vínculo.
 */
export function useWorkspaceMembros(workspaceId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["workspace-membros", workspaceId],
    enabled: !!workspaceId && enabled,
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, nome, cargo, avatar_url");
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      const { data: membros, error: membrosError } = await supabase
        .from("workspace_membros")
        .select("user_id")
        .eq("workspace_id", workspaceId!);
      if (membrosError) throw membrosError;

      const memberIds = new Set((membros ?? []).map((m) => m.user_id));
      const roleByUser = new Map<string, "admin" | "editor">();
      for (const r of roles ?? []) {
        if (r.role === "admin") roleByUser.set(r.user_id, "admin");
        else if (r.role === "editor" && !roleByUser.has(r.user_id)) {
          roleByUser.set(r.user_id, "editor");
        }
      }

      return (profiles ?? []).map((p) => {
        const gestorRole = roleByUser.get(p.user_id) ?? null;
        return {
          user_id: p.user_id,
          nome: p.nome,
          cargo: p.cargo ?? null,
          avatar_url: p.avatar_url,
          is_member: memberIds.has(p.user_id),
          is_gestor: gestorRole !== null,
          gestor_role: gestorRole,
        };
      }) as WorkspaceMemberRow[];
    },
  });
}

export function useToggleWorkspaceMembro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      userId,
      isMember,
    }: {
      workspaceId: string;
      userId: string;
      isMember: boolean;
    }) => {
      if (isMember) {
        const { error } = await supabase
          .from("workspace_membros")
          .insert({ workspace_id: workspaceId, user_id: userId });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("workspace_membros")
          .delete()
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-membros", variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
