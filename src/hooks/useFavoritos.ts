import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";

export interface Favorito {
  id: string;
  user_id: string;
  arquivo_id: string;
  created_at: string;
}

export function useFavoritos() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["favoritos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("favoritos")
        .select(`
          id,
          user_id,
          arquivo_id,
          created_at,
          arquivos!inner (
            id,
            obra_id,
            pasta_id,
            nome,
            arquivo_url,
            tipo,
            tamanho,
            created_at,
            updated_at,
            deleted_at,
            uploaded_by
          )
        `)
        .eq("user_id", user.id)
        .is("arquivos.deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useIsFavorito(arquivoId: string) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["favorito", user?.id, arquivoId],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from("favoritos")
        .select("id")
        .eq("user_id", user.id)
        .eq("arquivo_id", arquivoId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!arquivoId,
  });
}

export function useToggleFavorito() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ arquivoId, isFavorito }: { arquivoId: string; isFavorito: boolean }) => {
      if (!user) throw new Error("User not authenticated");

      if (isFavorito) {
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .eq("user_id", user.id)
          .eq("arquivo_id", arquivoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favoritos")
          .insert({ user_id: user.id, arquivo_id: arquivoId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { arquivoId }) => {
      queryClient.invalidateQueries({ queryKey: ["favoritos"] });
      queryClient.invalidateQueries({ queryKey: ["favorito", user?.id, arquivoId] });
    },
  });
}
