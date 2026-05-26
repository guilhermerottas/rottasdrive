import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Cite } from "@/lib/chatStream";

export interface ChatConversa {
  id: string;
  user_id: string;
  workspace_id: string | null;
  obra_id: string | null;
  titulo: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMensagemRow {
  id: string;
  conversa_id: string;
  role: string;
  content: string;
  citacoes: Cite[] | null;
  tool_calls: unknown;
  created_at: string;
}

export function useChatConversas() {
  return useQuery({
    queryKey: ["chat-conversas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_conversas")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ChatConversa[];
    },
    staleTime: 30_000,
  });
}

export async function fetchConversaMensagens(conversaId: string): Promise<ChatMensagemRow[]> {
  const { data, error } = await supabase
    .from("chat_mensagens")
    .select("id, conversa_id, role, content, citacoes, tool_calls, created_at")
    .eq("conversa_id", conversaId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMensagemRow[];
}

export function useDeleteConversa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_conversas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-conversas"] });
    },
  });
}
