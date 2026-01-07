import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Arquivo {
  id: string;
  obra_id: string;
  pasta_id: string | null;
  nome: string;
  arquivo_url: string;
  tipo: string | null;
  tamanho: number | null;
  created_at: string;
  updated_at: string;
}

export function useArquivos(obraId: string, pastaId?: string | null) {
  return useQuery({
    queryKey: ["arquivos", obraId, pastaId],
    queryFn: async () => {
      let query = supabase
        .from("arquivos")
        .select("*")
        .eq("obra_id", obraId)
        .order("nome", { ascending: true });

      if (pastaId) {
        query = query.eq("pasta_id", pastaId);
      } else {
        query = query.is("pasta_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Arquivo[];
    },
    enabled: !!obraId,
  });
}

export function useUploadArquivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      obraId,
      pastaId,
    }: {
      file: File;
      obraId: string;
      pastaId?: string | null;
    }) => {
      // Upload file to storage
      const fileName = `${obraId}/${pastaId || "root"}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("arquivos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("arquivos")
        .getPublicUrl(fileName);

      // Create arquivo record
      const { data, error } = await supabase
        .from("arquivos")
        .insert({
          obra_id: obraId,
          pasta_id: pastaId,
          nome: file.name,
          arquivo_url: urlData.publicUrl,
          tipo: file.type,
          tamanho: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arquivos"] });
    },
  });
}

export function useDeleteArquivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, arquivoUrl }: { id: string; arquivoUrl: string }) => {
      // Extract file path from URL
      const url = new URL(arquivoUrl);
      const pathParts = url.pathname.split("/storage/v1/object/public/arquivos/");
      if (pathParts[1]) {
        await supabase.storage.from("arquivos").remove([decodeURIComponent(pathParts[1])]);
      }

      const { error } = await supabase.from("arquivos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arquivos"] });
    },
  });
}
