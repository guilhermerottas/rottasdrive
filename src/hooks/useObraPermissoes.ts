import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { PastaAcao, ACOES_PADRAO } from "@/hooks/usePastaPermissoes";

export interface ObraPermissaoMembro {
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

/** Ações efetivas do usuário atual numa coleção (gating de UI). */
export function useObraAcoes(obraId: string | undefined) {
  return useQuery({
    queryKey: ["obra-acoes", obraId],
    enabled: !!obraId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [] as PastaAcao[];

      const { data, error } = await supabase.rpc("obra_acoes_efetivas", {
        _user_id: uid,
        _obra_id: obraId!,
      });
      if (error) throw error;
      return (data ?? []) as PastaAcao[];
    },
  });
}

/**
 * Membros do workspace da obra + as ações configuradas para ESTA coleção.
 * Gestores (admin/editor) aparecem com acesso total.
 */
export function useObraPermissoes(
  obraId: string | undefined,
  workspaceId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: ["obra-permissoes", obraId],
    enabled: !!obraId && !!workspaceId && enabled,
    queryFn: async () => {
      const [profilesRes, rolesRes, membrosRes, permsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, nome, cargo, avatar_url"),
        supabase.from("user_roles").select("user_id, role"),
        supabase
          .from("workspace_membros")
          .select("user_id")
          .eq("workspace_id", workspaceId!),
        supabase
          .from("obra_permissoes")
          .select("user_id, acoes")
          .eq("obra_id", obraId!),
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

      const rows: ObraPermissaoMembro[] = (profilesRes.data ?? [])
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

export function useSaveObraPermissoes() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      obraId,
      membros,
    }: {
      obraId: string;
      membros: { user_id: string; acoes: PastaAcao[] }[];
    }) => {
      const toUpsert = membros
        .filter((m) => !sameAcoes(m.acoes, ACOES_PADRAO))
        .map((m) => ({
          obra_id: obraId,
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
          .from("obra_permissoes")
          .upsert(toUpsert, { onConflict: "obra_id,user_id" });
        if (error) throw error;
      }

      if (toDeleteIds.length > 0) {
        const { error } = await supabase
          .from("obra_permissoes")
          .delete()
          .eq("obra_id", obraId)
          .in("user_id", toDeleteIds);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["obra-permissoes", variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ["obra-acoes", variables.obraId] });
      // Mudança na obra muda o default das pastas — invalida pasta-acoes.
      queryClient.invalidateQueries({ queryKey: ["pasta-acoes"] });
    },
  });
}
