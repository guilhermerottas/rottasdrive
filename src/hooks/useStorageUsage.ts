import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useStorageUsage() {
  return useQuery({
    queryKey: ["storage-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arquivos")
        .select("tamanho");

      if (error) throw error;

      const totalBytes = data?.reduce((acc, file) => acc + (file.tamanho || 0), 0) || 0;
      const totalGB = totalBytes / (1024 * 1024 * 1024);
      
      return {
        usedBytes: totalBytes,
        usedGB: totalGB,
        maxGB: 100,
        percentage: (totalGB / 100) * 100,
      };
    },
  });
}
