import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RecentUpload {
  id: string;
  nome: string;
  tamanho: number | null;
  tipo: string | null;
  created_at: string;
  obra_nome: string | null;
}

/** Lista os arquivos criados nas últimas N horas (default 24). RLS já restringe ao que o usuário pode ver. */
export function useRecentUploads(hours = 24, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["recent-uploads", hours],
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<RecentUpload[]> => {
      const since = new Date(Date.now() - hours * 3600_000).toISOString();
      const { data, error } = await supabase
        .from("arquivos")
        .select("id, nome, tamanho, tipo, created_at, obras(nome)")
        .gte("created_at", since)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        id: a.id,
        nome: a.nome,
        tamanho: a.tamanho,
        tipo: a.tipo,
        created_at: a.created_at,
        obra_nome: a.obras?.nome ?? null,
      }));
    },
  });
}
