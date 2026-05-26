import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminUploadRow {
  arquivo_id: string;
  nome: string;
  tipo: string | null;
  tamanho: number;
  created_at: string;
  obra_id: string;
  obra_nome: string;
  pasta_id: string | null;
  pasta_nome: string | null;
  workspace_id: string;
  workspace_nome: string;
  uploaded_by: string | null;
  uploader_nome: string | null;
}

export interface AdminUploadsFilters {
  from: string;
  to: string;
  workspaceId?: string | null;
  uploadedBy?: string | null;
  tipoPrefix?: string | null;
  limit?: number;
}

export function useAdminUploadsList(filters: AdminUploadsFilters) {
  const { from, to, workspaceId, uploadedBy, tipoPrefix, limit = 200 } = filters;
  return useQuery({
    queryKey: ["admin-analytics", "uploads-list", from, to, workspaceId ?? null, uploadedBy ?? null, tipoPrefix ?? null, limit],
    staleTime: 60_000,
    queryFn: async (): Promise<AdminUploadRow[]> => {
      // RPC tipada genericamente — types.ts ainda não inclui admin_uploads_list.
      const { data, error } = await (supabase.rpc as any)("admin_uploads_list", {
        _from: from,
        _to: to,
        _workspace_id: workspaceId ?? null,
        _uploaded_by: uploadedBy ?? null,
        _tipo_prefix: tipoPrefix ?? null,
        _limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as AdminUploadRow[];
    },
  });
}
