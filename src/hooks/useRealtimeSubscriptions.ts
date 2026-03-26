import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to Supabase Realtime changes on obras, pastas, arquivos, and favoritos.
 * Automatically invalidates the relevant React Query caches when changes occur.
 */
export function useRealtimeSubscriptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "obras" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["obras"] });
          queryClient.invalidateQueries({ queryKey: ["obra"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pastas" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pastas"] });
          queryClient.invalidateQueries({ queryKey: ["all-pastas"] });
          queryClient.invalidateQueries({ queryKey: ["pastas-trash"] });
          queryClient.invalidateQueries({ queryKey: ["pasta-breadcrumb"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "arquivos" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["arquivos"] });
          queryClient.invalidateQueries({ queryKey: ["arquivos-trash"] });
          queryClient.invalidateQueries({ queryKey: ["arquivos-count"] });
          queryClient.invalidateQueries({ queryKey: ["storage-usage"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favoritos" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["favoritos"] });
          queryClient.invalidateQueries({ queryKey: ["favorito"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
