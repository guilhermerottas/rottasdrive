import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Obra {
  id: string;
  nome: string;
  descricao: string | null;
  foto_url: string | null;
  endereco: string | null;
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
    mutationFn: async ({ 
      nome, 
      descricao, 
      endereco, 
      foto 
    }: { 
      nome: string; 
      descricao?: string; 
      endereco?: string;
      foto?: File;
    }) => {
      let foto_url: string | undefined;

      // Upload photo if provided
      if (foto) {
        const fileName = `obras/${Date.now()}_${foto.name}`;
        const { error: uploadError } = await supabase.storage
          .from("arquivos")
          .upload(fileName, foto);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("arquivos")
          .getPublicUrl(fileName);

        foto_url = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("obras")
        .insert({ nome, descricao, endereco, foto_url })
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

export function useUpdateObra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      nome, 
      descricao, 
      endereco, 
      foto,
      currentFotoUrl
    }: { 
      id: string;
      nome: string; 
      descricao?: string; 
      endereco?: string;
      foto?: File;
      currentFotoUrl?: string | null;
    }) => {
      let foto_url: string | undefined = currentFotoUrl || undefined;

      // Upload new photo if provided
      if (foto) {
        const fileName = `obras/${Date.now()}_${foto.name}`;
        const { error: uploadError } = await supabase.storage
          .from("arquivos")
          .upload(fileName, foto);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("arquivos")
          .getPublicUrl(fileName);

        foto_url = urlData.publicUrl;

        // Delete old photo if exists
        if (currentFotoUrl) {
          const url = new URL(currentFotoUrl);
          const pathParts = url.pathname.split("/storage/v1/object/public/arquivos/");
          if (pathParts[1]) {
            await supabase.storage.from("arquivos").remove([decodeURIComponent(pathParts[1])]);
          }
        }
      }

      const { data, error } = await supabase
        .from("obras")
        .update({ nome, descricao, endereco, foto_url })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      queryClient.invalidateQueries({ queryKey: ["obra"] });
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
