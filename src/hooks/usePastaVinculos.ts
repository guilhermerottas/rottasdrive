import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";

export interface PastaVinculo {
  id: string;
  pasta_id: string;
  obra_destino_id: string;
  workspace_destino_id: string;
  created_at: string;
  workspace: { id: string; nome: string; cor: string | null; icone: string | null } | null;
  obra: { id: string; nome: string } | null;
}

export function usePastaVinculos(pastaId: string | undefined) {
  return useQuery({
    queryKey: ["pasta-vinculos", pastaId],
    enabled: !!pastaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pasta_workspace_vinculos")
        .select(
          `id, pasta_id, obra_destino_id, workspace_destino_id, created_at,
           workspace:workspaces!pasta_workspace_vinculos_workspace_destino_id_fkey (id, nome, cor, icone),
           obra:obras!pasta_workspace_vinculos_obra_destino_id_fkey (id, nome)`
        )
        .eq("pasta_id", pastaId!);
      if (error) throw error;
      return (data ?? []) as unknown as PastaVinculo[];
    },
  });
}

/**
 * Contagem de vínculos por pasta (uma query para várias pastas).
 * Retorna um Map<pasta_id, count>.
 */
export function useVinculosCountPorPasta(pastaIds: string[]) {
  return useQuery({
    queryKey: ["pasta-vinculos-count", [...pastaIds].sort().join(",")],
    enabled: pastaIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pasta_workspace_vinculos")
        .select("pasta_id")
        .in("pasta_id", pastaIds);
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) {
        map.set(row.pasta_id, (map.get(row.pasta_id) ?? 0) + 1);
      }
      return map;
    },
  });
}

export interface VinculoAlvo {
  workspaceId: string;
  obraId: string;
}

/**
 * Sincroniza vínculos da pasta com a lista alvo: insere os novos, deleta os
 * que sumiram. Não toca os que continuam iguais.
 */
export function useSetPastaVinculos() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      pastaId,
      alvos,
    }: {
      pastaId: string;
      alvos: VinculoAlvo[];
    }) => {
      const { data: atuais, error: readError } = await supabase
        .from("pasta_workspace_vinculos")
        .select("id, workspace_destino_id, obra_destino_id")
        .eq("pasta_id", pastaId);
      if (readError) throw readError;

      const atuaisMap = new Map(
        (atuais ?? []).map((v) => [v.workspace_destino_id, v])
      );
      const alvosMap = new Map(alvos.map((a) => [a.workspaceId, a]));

      // Inserir / atualizar
      const toInsert: Array<{
        pasta_id: string;
        obra_destino_id: string;
        workspace_destino_id: string;
        created_by: string | null;
      }> = [];
      const toUpdate: Array<{ id: string; obra_destino_id: string }> = [];
      for (const a of alvos) {
        const atual = atuaisMap.get(a.workspaceId);
        if (!atual) {
          toInsert.push({
            pasta_id: pastaId,
            obra_destino_id: a.obraId,
            workspace_destino_id: a.workspaceId,
            created_by: user?.id ?? null,
          });
        } else if (atual.obra_destino_id !== a.obraId) {
          toUpdate.push({ id: atual.id, obra_destino_id: a.obraId });
        }
      }

      // Deletar os que sumiram
      const toDeleteIds = (atuais ?? [])
        .filter((v) => !alvosMap.has(v.workspace_destino_id))
        .map((v) => v.id);

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from("pasta_workspace_vinculos")
          .insert(toInsert);
        if (error) throw error;
      }
      for (const up of toUpdate) {
        const { error } = await supabase
          .from("pasta_workspace_vinculos")
          .update({ obra_destino_id: up.obra_destino_id })
          .eq("id", up.id);
        if (error) throw error;
      }
      if (toDeleteIds.length > 0) {
        const { error } = await supabase
          .from("pasta_workspace_vinculos")
          .delete()
          .in("id", toDeleteIds);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pasta-vinculos", variables.pastaId] });
      queryClient.invalidateQueries({ queryKey: ["pasta-vinculos-count"] });
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
    },
  });
}
