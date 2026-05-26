import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { streamChat, type Cite, type FileResultRow } from "@/lib/chatStream";
import { fetchConversaMensagens } from "@/hooks/useChatHistory";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citacoes?: Cite[];
  fileResults?: FileResultRow[];
  isLoading?: boolean;
  isError?: boolean;
  statusLabel?: string;
}

export interface ChatScope {
  workspace_id: string | null;
  obra_id: string | null;
}

const EMPTY_SCOPE: ChatScope = { workspace_id: null, obra_id: null };

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scope, setScope] = useState<ChatScope>(EMPTY_SCOPE);
  const [activeConversaId, setActiveConversaId] = useState<string | null>(null);
  const convRef = useRef<string | null>(null);
  const qc = useQueryClient();

  const invalidateConversas = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["chat-conversas"] });
  }, [qc]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;
      const text = content.trim();

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };
      const assistantId = crypto.randomUUID();
      const loading: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        isLoading: true,
        statusLabel: "Pensando…",
      };

      setMessages((prev) => [...prev, userMsg, loading]);
      setIsLoading(true);

      const patch = (fields: Partial<ChatMessage>) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...fields } : m)));

      let acc = "";
      let allCitacoes: Cite[] = [];
      let fileResults: FileResultRow[] = [];

      await streamChat(
        {
          message: text,
          workspace_id: scope.workspace_id,
          obra_id: scope.obra_id,
          conversa_id: convRef.current,
        },
        {
          onMeta: ({ conversa_id }) => {
            if (!convRef.current) {
              convRef.current = conversa_id;
              setActiveConversaId(conversa_id);
              invalidateConversas();
            }
          },
          onToolCall: (e) => {
            patch({
              statusLabel:
                e.name === "buscar_conteudo"
                  ? "Buscando no conteúdo dos arquivos…"
                  : e.name === "buscar_arquivo"
                    ? "Procurando o arquivo…"
                    : "Consultando…",
              isLoading: true,
            });
          },
          onToolResult: (e) => {
            if (e.name === "buscar_arquivo") {
              const result = e.result as { results?: FileResultRow[] } | undefined;
              const rows = result?.results ?? [];
              if (rows.length > 0) {
                fileResults = [...fileResults, ...rows];
                patch({ fileResults });
              }
            }
          },
          onCitation: (cites) => {
            allCitacoes = dedupCites([...allCitacoes, ...cites]);
            patch({ citacoes: allCitacoes });
          },
          onDelta: (text) => {
            acc += text;
            patch({
              content: acc,
              isLoading: false,
              statusLabel: undefined,
              citacoes: allCitacoes,
              fileResults,
            });
          },
          onDone: (done) => {
            patch({
              content: acc || "(sem resposta)",
              isLoading: false,
              statusLabel: undefined,
              citacoes: done.citacoes?.length ? done.citacoes : allCitacoes,
              fileResults,
            });
            invalidateConversas();
          },
          onError: (msg) => {
            patch({ content: msg, isLoading: false, isError: true, statusLabel: undefined });
          },
        },
      );

      setIsLoading(false);
    },
    [isLoading, scope, invalidateConversas],
  );

  const loadConversa = useCallback(async (id: string) => {
    const rows = await fetchConversaMensagens(id);
    convRef.current = id;
    setActiveConversaId(id);
    setMessages(
      rows
        .filter((r) => r.role === "user" || r.role === "assistant")
        .map<ChatMessage>((r) => ({
          id: r.id,
          role: r.role as "user" | "assistant",
          content: r.content,
          citacoes: r.citacoes ?? undefined,
        })),
    );
  }, []);

  const newConversation = useCallback(() => {
    convRef.current = null;
    setActiveConversaId(null);
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    scope,
    setScope,
    activeConversaId,
    loadConversa,
    newConversation,
  };
}

function dedupCites(cites: Cite[]): Cite[] {
  const seen = new Set<string>();
  const out: Cite[] = [];
  for (const c of cites) {
    const k = `${c.arquivo_id}:${c.page_number ?? "_"}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(c);
    }
  }
  return out;
}
