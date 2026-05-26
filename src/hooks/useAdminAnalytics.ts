import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STALE = 5 * 60 * 1000;

export interface AccessByDay {
  dia: string;
  total: number;
}
export interface UploadsByPeriod {
  periodo: string;
  total: number;
}
export interface TopFolder {
  pasta_id: string;
  pasta_nome: string;
  obra_nome: string;
  total: number;
}
export interface HeaviestFile {
  arquivo_id: string;
  nome: string;
  tamanho: number;
  obra_nome: string;
  pasta_nome: string | null;
}

export function useAccessByDay(days = 30) {
  return useQuery({
    queryKey: ["admin-analytics", "access-by-day", days],
    staleTime: STALE,
    queryFn: async (): Promise<AccessByDay[]> => {
      const { data, error } = await supabase.rpc("admin_access_by_day", { _days: days });
      if (error) throw error;
      return (data ?? []) as AccessByDay[];
    },
  });
}

export function useUploadsByMonth(months = 12) {
  return useQuery({
    queryKey: ["admin-analytics", "uploads-by-month", months],
    staleTime: STALE,
    queryFn: async (): Promise<UploadsByPeriod[]> => {
      const { data, error } = await supabase.rpc("admin_uploads_by_month", { _months: months });
      if (error) throw error;
      return (data ?? []).map((r) => ({ periodo: r.mes, total: r.total }));
    },
  });
}

export function useUploadsByWeek(weeks = 12) {
  return useQuery({
    queryKey: ["admin-analytics", "uploads-by-week", weeks],
    staleTime: STALE,
    queryFn: async (): Promise<UploadsByPeriod[]> => {
      const { data, error } = await supabase.rpc("admin_uploads_by_week", { _weeks: weeks });
      if (error) throw error;
      return (data ?? []).map((r) => ({ periodo: r.semana, total: r.total }));
    },
  });
}

export function useTopFolders(limit = 10) {
  return useQuery({
    queryKey: ["admin-analytics", "top-folders", limit],
    staleTime: STALE,
    queryFn: async (): Promise<TopFolder[]> => {
      const { data, error } = await supabase.rpc("admin_folders_top", { _limit: limit });
      if (error) throw error;
      return (data ?? []) as TopFolder[];
    },
  });
}

export function useHeaviestFiles(limit = 20) {
  return useQuery({
    queryKey: ["admin-analytics", "heaviest-files", limit],
    staleTime: STALE,
    queryFn: async (): Promise<HeaviestFile[]> => {
      const { data, error } = await supabase.rpc("admin_heaviest_files", { _limit: limit });
      if (error) throw error;
      return (data ?? []) as HeaviestFile[];
    },
  });
}
