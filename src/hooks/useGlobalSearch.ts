import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  nome: string;
  arquivo_url: string;
  tipo: string | null;
  tamanho: number | null;
  created_at: string;
  obra_id: string;
  pasta_id: string | null;
  obra_nome: string;
  pasta_nome: string | null;
}

export function useGlobalSearch(searchTerm: string) {
  return useQuery({
    queryKey: ["global-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      // Search arquivos with obra and pasta info
      const { data: arquivos, error } = await supabase
        .from("arquivos")
        .select("id, nome, arquivo_url, tipo, tamanho, created_at, obra_id, pasta_id")
        .is("deleted_at", null)
        .ilike("nome", `%${searchTerm}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!arquivos || arquivos.length === 0) return [];

      // Get unique obra_ids and pasta_ids
      const obraIds = [...new Set(arquivos.map(a => a.obra_id))];
      const pastaIds = [...new Set(arquivos.filter(a => a.pasta_id).map(a => a.pasta_id))];

      // Fetch obras
      const { data: obras } = await supabase
        .from("obras")
        .select("id, nome")
        .in("id", obraIds);

      // Fetch pastas if any
      let pastas: { id: string; nome: string }[] = [];
      if (pastaIds.length > 0) {
        const { data: pastasData } = await supabase
          .from("pastas")
          .select("id, nome")
          .in("id", pastaIds as string[]);
        pastas = pastasData || [];
      }

      const obraMap = new Map(obras?.map(o => [o.id, o.nome]) || []);
      const pastaMap = new Map(pastas.map(p => [p.id, p.nome]));

      return arquivos.map(a => ({
        ...a,
        obra_nome: obraMap.get(a.obra_id) || "Obra desconhecida",
        pasta_nome: a.pasta_id ? pastaMap.get(a.pasta_id) || null : null,
      })) as SearchResult[];
    },
    enabled: searchTerm.length >= 2,
    staleTime: 30000,
  });
}
