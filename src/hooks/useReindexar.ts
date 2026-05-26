import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReindexarParams {
  workspace_id?: string;
  obra_id?: string;
  pasta_id?: string;
  only_pendente?: boolean;
}

export function useReindexar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ReindexarParams) => {
      const { data, error } = await supabase.functions.invoke<{
        enfileirados: number;
        message?: string;
      }>("reindexar-escopo", {
        body: params,
      });
      if (error) throw error;
      if (!data) throw new Error("resposta vazia");
      return data;
    },
    onSuccess: (data) => {
      if (data.enfileirados === 0) {
        toast.info(data.message ?? "Nenhum arquivo para indexar");
      } else {
        toast.success(
          `${data.enfileirados} ${data.enfileirados === 1 ? "arquivo enfileirado" : "arquivos enfileirados"} para indexação`,
        );
      }
      // Invalida queries de arquivos pra mostrar badge "Indexando…" rapidamente
      queryClient.invalidateQueries({ queryKey: ["arquivos"] });
    },
    onError: (e: Error) => {
      toast.error(`Falha ao reindexar: ${e.message}`);
    },
  });
}
