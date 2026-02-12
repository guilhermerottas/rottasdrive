import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PastaColor = "default" | "yellow" | "blue" | "gray" | "orange_dark" | "beige";

export interface Pasta {
  id: string;
  obra_id: string;
  pasta_pai_id: string | null;
  nome: string;
  cor: PastaColor;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface PastaWithObra extends Pasta {
  obras: { nome: string } | null;
}

export function usePastas(obraId: string, pastaPaiId?: string | null) {
  return useQuery({
    queryKey: ["pastas", obraId, pastaPaiId],
    queryFn: async () => {
      let query = supabase
        .from("pastas")
        .select("*")
        .eq("obra_id", obraId)
        .is("deleted_at", null)
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

export function useAllPastas(obraId: string) {
  return useQuery({
    queryKey: ["all-pastas", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pastas")
        .select("*")
        .eq("obra_id", obraId)
        .is("deleted_at", null)
        .order("nome", { ascending: true });
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
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();

      // Soft-delete the folder
      const { error } = await supabase
        .from("pastas")
        .update({ deleted_at: now, deleted_by: user?.id || null })
        .eq("id", id);
      if (error) throw error;

      // Soft-delete all files inside this folder (and subfolders recursively)
      await softDeleteFolderContents(id, user?.id || null, now);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos-trash"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos-count"] });
      queryClient.invalidateQueries({ queryKey: ["pastas-trash"] });
    },
  });
}

async function softDeleteFolderContents(pastaId: string, userId: string | null, deletedAt: string) {
  // Soft-delete files in this folder
  await supabase
    .from("arquivos")
    .update({ deleted_at: deletedAt, deleted_by: userId })
    .eq("pasta_id", pastaId)
    .is("deleted_at", null);

  // Find subfolders
  const { data: subfolders } = await supabase
    .from("pastas")
    .select("id")
    .eq("pasta_pai_id", pastaId)
    .is("deleted_at", null);

  if (subfolders) {
    for (const sub of subfolders) {
      await supabase
        .from("pastas")
        .update({ deleted_at: deletedAt, deleted_by: userId })
        .eq("id", sub.id);
      await softDeleteFolderContents(sub.id, userId, deletedAt);
    }
  }
}

export function useUpdatePastaColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cor }: { id: string; cor: PastaColor }) => {
      const { error } = await supabase
        .from("pastas")
        .update({ cor })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
      queryClient.invalidateQueries({ queryKey: ["all-pastas"] });
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

export function useTrashPastas() {
  return useQuery({
    queryKey: ["pastas-trash"],
    queryFn: async () => {
      // Only show top-level deleted pastas (not subfolders deleted as part of parent)
      const { data, error } = await supabase
        .from("pastas")
        .select("*, obras(nome)")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      
      // Filter to only show root-level deletions (parent not deleted or no parent)
      const deletedIds = new Set((data || []).map((p: any) => p.id));
      return (data || []).filter((p: any) => {
        if (!p.pasta_pai_id) return true;
        return !deletedIds.has(p.pasta_pai_id);
      }) as PastaWithObra[];
    },
  });
}

export function useRestorePasta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Restore the folder
      const { error } = await supabase
        .from("pastas")
        .update({ deleted_at: null, deleted_by: null })
        .eq("id", id);
      if (error) throw error;

      // Restore contents recursively
      await restoreFolderContents(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
      queryClient.invalidateQueries({ queryKey: ["pastas-trash"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos-trash"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos-count"] });
    },
  });
}

async function restoreFolderContents(pastaId: string) {
  // Restore files in this folder
  await supabase
    .from("arquivos")
    .update({ deleted_at: null, deleted_by: null })
    .eq("pasta_id", pastaId)
    .not("deleted_at", "is", null);

  // Find and restore subfolders
  const { data: subfolders } = await supabase
    .from("pastas")
    .select("id")
    .eq("pasta_pai_id", pastaId)
    .not("deleted_at", "is", null);

  if (subfolders) {
    for (const sub of subfolders) {
      await supabase
        .from("pastas")
        .update({ deleted_at: null, deleted_by: null })
        .eq("id", sub.id);
      await restoreFolderContents(sub.id);
    }
  }
}

export function useDeletePastaPermanently() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete files from storage and DB recursively
      await deleteFolderContentsPermanently(id);
      
      // Delete the folder itself
      const { error } = await supabase.from("pastas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastas-trash"] });
      queryClient.invalidateQueries({ queryKey: ["arquivos-trash"] });
    },
  });
}

async function deleteFolderContentsPermanently(pastaId: string) {
  // Get files in this folder
  const { data: files } = await supabase
    .from("arquivos")
    .select("id, arquivo_url")
    .eq("pasta_id", pastaId);

  if (files) {
    for (const file of files) {
      const url = new URL(file.arquivo_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/arquivos/");
      if (pathParts[1]) {
        await supabase.storage.from("arquivos").remove([decodeURIComponent(pathParts[1])]);
      }
      await supabase.from("arquivos").delete().eq("id", file.id);
    }
  }

  // Handle subfolders
  const { data: subfolders } = await supabase
    .from("pastas")
    .select("id")
    .eq("pasta_pai_id", pastaId);

  if (subfolders) {
    for (const sub of subfolders) {
      await deleteFolderContentsPermanently(sub.id);
      await supabase.from("pastas").delete().eq("id", sub.id);
    }
  }
}
