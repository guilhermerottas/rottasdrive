import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Obra {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
}

export function useObras() {
  return useQuery({
    queryKey: ["obras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Obra[];
    },
  });
}

export function useCreateObra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nome, descricao }: { nome: string; descricao?: string }) => {
      const { data, error } = await supabase
        .from("obras")
        .insert({ nome, descricao })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
    },
  });
}

export function useDeleteObra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("obras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
    },
  });
}
