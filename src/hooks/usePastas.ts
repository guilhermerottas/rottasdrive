import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Pasta {
  id: string;
  obra_id: string;
  pasta_pai_id: string | null;
  nome: string;
  created_at: string;
  updated_at: string;
}

export function usePastas(obraId: string, pastaPaiId?: string | null) {
  return useQuery({
    queryKey: ["pastas", obraId, pastaPaiId],
    queryFn: async () => {
      let query = supabase
        .from("pastas")
        .select("*")
        .eq("obra_id", obraId)
        .order("nome", { ascending: true });

      if (pastaPaiId) {
        query = query.eq("pasta_pai_id", pastaPaiId);
      } else {
        query = query.is("pasta_pai_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Pasta[];
    },
    enabled: !!obraId,
  });
}

export function useCreatePasta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nome,
      obraId,
      pastaPaiId,
    }: {
      nome: string;
      obraId: string;
      pastaPaiId?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("pastas")
        .insert({ nome, obra_id: obraId, pasta_pai_id: pastaPaiId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
    },
  });
}

export function useDeletePasta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pastas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
    },
  });
}

export function usePastaBreadcrumb(pastaId: string | null) {
  return useQuery({
    queryKey: ["pasta-breadcrumb", pastaId],
    queryFn: async () => {
      if (!pastaId) return [];

      const breadcrumb: Pasta[] = [];
      let currentId: string | null = pastaId;

      while (currentId) {
        const { data, error } = await supabase
          .from("pastas")
          .select("*")
          .eq("id", currentId)
          .single();

        if (error || !data) break;

        breadcrumb.unshift(data as Pasta);
        currentId = data.pasta_pai_id;
      }

      return breadcrumb;
    },
    enabled: !!pastaId,
  });
}
