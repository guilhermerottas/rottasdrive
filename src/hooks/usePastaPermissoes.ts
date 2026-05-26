import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";

export type PastaAcao = "ver" | "baixar" | "link" | "add" | "editar" | "excluir";

export const PASTA_ACOES: { value: PastaAcao; label: string }[] = [
  { value: "ver", label: "Ver" },
  { value: "baixar", label: "Baixar" },
  { value: "link", label: "Link" },
  { value: "add", label: "Add" },
  { value: "editar", label: "Editar" },
  { value: "excluir", label: "Excluir" },
];

/** Padrão para membros do workspace sem configuração explícita. */
export const ACOES_PADRAO: PastaAcao[] = ["ver", "baixar"];

export interface PastaPermissaoMembro {
  user_id: string;
  nome: string | null;
  cargo: string | null;
  avatar_url: string | null;
  is_gestor: boolean;
  gestor_role: "admin" | "editor" | null;
  acoes: PastaAcao[];
}

const sameAcoes = (a: PastaAcao[], b: PastaAcao[]) => {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
};

/** Ações efetivas do usuário atual numa pasta dentro de um workspace (gating de UI). */
export function usePastaAcoes(
  pastaId: string | undefined,
  workspaceId: string | undefined
) {
  return useQuery({
    queryKey: ["pasta-acoes", pastaId, workspaceId],
    enabled: !!pastaId && !!workspaceId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [] as PastaAcao[];

      const { data, error } = await supabase.rpc("pasta_acoes_efetivas_ws", {
        _user_id: uid,
        _pasta_id: pastaId!,
        _workspace_id: workspaceId!,
      });
      if (error) throw error;
      return (data ?? []) as PastaAcao[];
    },
  });
}

/**
 * Membros do workspace + as ações configuradas para ESTA pasta NESSE workspace.
 * Gestores (admin/editor) aparecem com acesso total.
 */
export function usePastaPermissoes(
  pastaId: string | undefined,
  workspaceId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: ["pasta-permissoes", pastaId, workspaceId],
    enabled: !!pastaId && !!workspaceId && enabled,
    queryFn: async () => {
      const [profilesRes, rolesRes, membrosRes, permsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, nome, cargo, avatar_url"),
        supabase.from("user_roles").select("user_id, role"),
        supabase
          .from("workspace_membros")
          .select("user_id")
          .eq("workspace_id", workspaceId!),
        supabase
          .from("pasta_permissoes")
          .select("user_id, acoes")
          .eq("pasta_id", pastaId!)
          .eq("workspace_id", workspaceId!),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (membrosRes.error) throw membrosRes.error;
      if (permsRes.error) throw permsRes.error;

      const roleByUser = new Map<string, "admin" | "editor">();
      for (const r of rolesRes.data ?? []) {
        if (r.role === "admin") roleByUser.set(r.user_id, "admin");
        else if (r.role === "editor" && !roleByUser.has(r.user_id)) {
          roleByUser.set(r.user_id, "editor");
        }
      }
      const memberIds = new Set((membrosRes.data ?? []).map((m) => m.user_id));
      const permMap = new Map(
        (permsRes.data ?? []).map((p) => [p.user_id, p.acoes as PastaAcao[]])
      );

      // Mostra membros do workspace + gestores (acesso total)
      const rows: PastaPermissaoMembro[] = (profilesRes.data ?? [])
        .filter((p) => memberIds.has(p.user_id) || roleByUser.has(p.user_id))
        .map((p) => {
          const gestorRole = roleByUser.get(p.user_id) ?? null;
          const isGestor = gestorRole !== null;
          return {
            user_id: p.user_id,
            nome: p.nome,
            cargo: p.cargo ?? null,
            avatar_url: p.avatar_url,
            is_gestor: isGestor,
            gestor_role: gestorRole,
            acoes: isGestor
              ? (["ver", "baixar", "link", "add", "editar", "excluir"] as PastaAcao[])
              : permMap.get(p.user_id) ?? ACOES_PADRAO,
          };
        });

      return rows;
    },
  });
}

/** Salva as permissões da pasta para os membros não-gestores num workspace. */
export function useSavePastaPermissoes() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      pastaId,
      workspaceId,
      membros,
    }: {
      pastaId: string;
      workspaceId: string;
      membros: { user_id: string; acoes: PastaAcao[] }[];
    }) => {
      const toUpsert = membros
        .filter((m) => !sameAcoes(m.acoes, ACOES_PADRAO))
        .map((m) => ({
          pasta_id: pastaId,
          workspace_id: workspaceId,
          user_id: m.user_id,
          acoes: m.acoes,
          updated_by: user?.id ?? null,
          updated_at: new Date().toISOString(),
        }));

      const toDeleteIds = membros
        .filter((m) => sameAcoes(m.acoes, ACOES_PADRAO))
        .map((m) => m.user_id);

      if (toUpsert.length > 0) {
        const { error } = await supabase
          .from("pasta_permissoes")
          .upsert(toUpsert, { onConflict: "pasta_id,workspace_id,user_id" });
        if (error) throw error;
      }

      if (toDeleteIds.length > 0) {
        const { error } = await supabase
          .from("pasta_permissoes")
          .delete()
          .eq("pasta_id", pastaId)
          .eq("workspace_id", workspaceId)
          .in("user_id", toDeleteIds);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["pasta-permissoes", variables.pastaId, variables.workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ["pasta-acoes", variables.pastaId] });
    },
  });
}
