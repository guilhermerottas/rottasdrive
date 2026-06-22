import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";

/** Usa o domínio onde o app está rodando agora (funciona em qualquer ambiente). */
export const publicShareUrl = (shortCode: string) => {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://drive.rottasconstrutora.com.br";
  return `${origin}/arquivos/p/${shortCode}`;
};

export interface PastaCompartilhamento {
  id: string;
  pasta_id: string;
  short_code: string;
  ativo: boolean;
  permite_download: boolean;
  created_at: string;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function genShortCode(len = 8): string {
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function usePastaCompartilhamento(pastaId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["pasta-compartilhamento", pastaId],
    enabled: !!pastaId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pasta_compartilhamentos")
        .select("*")
        .eq("pasta_id", pastaId!)
        .maybeSingle();
      if (error) throw error;
      return (data as PastaCompartilhamento) ?? null;
    },
  });
}

export function useSetPastaCompartilhamento() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      pastaId,
      ativo,
      permiteDownload,
    }: {
      pastaId: string;
      ativo: boolean;
      permiteDownload: boolean;
    }) => {
      const { data: existing } = await supabase
        .from("pasta_compartilhamentos")
        .select("id")
        .eq("pasta_id", pastaId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("pasta_compartilhamentos")
          .update({ ativo, permite_download: permiteDownload })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as PastaCompartilhamento;
      }

      // Cria com short_code único (retry em colisão)
      for (let attempt = 0; attempt < 6; attempt++) {
        const { data, error } = await supabase
          .from("pasta_compartilhamentos")
          .insert({
            pasta_id: pastaId,
            short_code: genShortCode(),
            ativo,
            permite_download: permiteDownload,
            created_by: user?.id ?? null,
          })
          .select()
          .single();
        if (!error) return data as PastaCompartilhamento;
        // 23505 = unique_violation (short_code colidiu) -> tenta de novo
        if (error.code !== "23505") throw error;
      }
      throw new Error("Não foi possível gerar o link. Tente novamente.");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pasta-compartilhamento", data.pasta_id] });
    },
  });
}
