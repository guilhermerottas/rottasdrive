import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UploaderProfile {
  nome: string | null;
}

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
  deleted_at: string | null;
  deleted_by: string | null;
  uploaded_by: string | null;
  descricao: string | null;
  uploader?: UploaderProfile | null;
}

export interface ArquivoWithObra extends Arquivo {
  obras: { nome: string } | null;
}

export function useArquivos(obraId: string, pastaId?: string | null) {
  return useQuery({
    queryKey: ["arquivos", obraId, pastaId],
    queryFn: async () => {
      let query = supabase
        .from("arquivos")
        .select("*")
        .eq("obra_id", obraId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (pastaId) {
        query = query.eq("pasta_id", pastaId);
      } else {
        query = query.is("pasta_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Buscar os perfis dos uploaders
      const arquivos = data as Arquivo[];
      const uploaderIds = [...new Set(arquivos.filter(a => a.uploaded_by).map(a => a.uploaded_by))];

      if (uploaderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, nome")
          .in("user_id", uploaderIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, { nome: p.nome }]) || []);

        return arquivos.map(a => ({
          ...a,
          uploader: a.uploaded_by ? profileMap.get(a.uploaded_by) || null : null
        }));
      }

      return arquivos;
    },
    enabled: !!obraId,
  });
}

export function useTrashArquivos() {
  return useQuery({
    queryKey: ["arquivos-trash"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arquivos")
        .select("*, obras(nome)")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return data as ArquivoWithObra[];
    },
  });
}

/**
 * Creates a database record for an uploaded file.
 * This should be called AFTER the file has been successfully uploaded to storage via TUS.
 */
export function useCreateArquivoRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      obraId,
      pastaId,
      nome,
      arquivoUrl,
      tipo,
      tamanho,
      descricao,
    }: {
      obraId: string;
      pastaId?: string | null;
      nome: string;
      arquivoUrl: string;
      tipo: string;
      tamanho: number;
      descricao?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("arquivos")
        .insert({
          obra_id: obraId,
          pasta_id: pastaId,
          nome: nome,
          arquivo_url: arquivoUrl,
          tipo: tipo,
          tamanho: tamanho,
          uploaded_by: user?.id || null,
          descricao: descricao || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arquivos"] });
      // Also invalidate recent files if there's a query for that
      queryClient.invalidateQueries({ queryKey: ["arquivos-count"] });
    },
  });
}

// Deprecated: Use useCreateArquivoRecord combined with uploadService for better large file support
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

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

      // Create arquivo record with uploaded_by
      const { data, error } = await supabase
        .from("arquivos")
        .insert({
          obra_id: obraId,
          pasta_id: pastaId,
          nome: file.name,
          arquivo_url: urlData.publicUrl,
          tipo: file.type,
          tamanho: file.size,
          uploaded_by: user?.id || null,
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

export function useMoveToTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("arquivos")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id || null
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arquivos"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos-trash"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos-count"] });
    },
  });
}

export function useRestoreArquivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("arquivos")
        .update({ deleted_at: null, deleted_by: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arquivos"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos-trash"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos-count"] });
    },
  });
}

export function useDeletePermanently() {
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
      queryClient.invalidateQueries({ queryKey: ["arquivos-trash"] });
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Buscar todos os arquivos na lixeira
      const { data: trashItems, error: fetchError } = await supabase
        .from("arquivos")
        .select("id, arquivo_url")
        .not("deleted_at", "is", null);

      if (fetchError) throw fetchError;
      if (!trashItems || trashItems.length === 0) return;

      // Remover arquivos do storage
      for (const item of trashItems) {
        const url = new URL(item.arquivo_url);
        const pathParts = url.pathname.split("/storage/v1/object/public/arquivos/");
        if (pathParts[1]) {
          await supabase.storage.from("arquivos").remove([decodeURIComponent(pathParts[1])]);
        }
      }

      // Deletar todos os registros
      const { error } = await supabase
        .from("arquivos")
        .delete()
        .not("deleted_at", "is", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arquivos-trash"] });
    },
  });
}

export function useMoveArquivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pastaId }: { id: string; pastaId: string | null }) => {
      const { error } = await supabase
        .from("arquivos")
        .update({ pasta_id: pastaId })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arquivos"] });
    },
  });
}

export function useRenameArquivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase
        .from("arquivos")
        .update({ nome })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arquivos"] });
    },
  });
}
