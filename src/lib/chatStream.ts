// Parser SSE pro chat-rag. supabase.functions.invoke não suporta streaming,
// então fetch + ReadableStream + parse manual de `event: X\ndata: {...}\n\n`.

import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export interface Cite {
  arquivo_id: string;
  nome: string;
  page_number: number | null;
  chunk_id?: string;
}

export interface FileResultRow {
  arquivo_id: string;
  nome: string;
  tipo: string | null;
  pasta_id: string | null;
  pasta_nome: string;
  obra_id: string;
  obra_nome: string;
  arquivo_url?: string;
  tamanho?: number | null;
  score: number;
}

export interface ChatStreamHandlers {
  onMeta?: (meta: { conversa_id: string }) => void;
  onDelta?: (text: string) => void;
  onToolCall?: (e: { id: string; name: string; args: unknown }) => void;
  onToolResult?: (e: { id: string; name: string; result: unknown }) => void;
  onCitation?: (citacoes: Cite[]) => void;
  onDone?: (e: {
    conversa_id: string;
    prompt_tokens: number;
    completion_tokens: number;
    cost_usd: number;
    citacoes: Cite[];
  }) => void;
  onError?: (message: string) => void;
}

export interface ChatStreamPayload {
  message: string;
  workspace_id?: string | null;
  obra_id?: string | null;
  conversa_id?: string | null;
}

export async function streamChat(
  payload: ChatStreamPayload,
  handlers: ChatStreamHandlers,
): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    handlers.onError?.("Sessão expirada. Faça login novamente.");
    return;
  }

  let res: Response;
  try {
    res = await fetch(`${FUNCTIONS_URL}/chat-rag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    handlers.onError?.("Erro ao conectar com o assistente.");
    return;
  }

  if (!res.ok || !res.body) {
    let msg = "Erro ao processar mensagem.";
    try {
      const body = await res.json();
      msg = body?.error || msg;
    } catch {
      // sem JSON
    }
    handlers.onError?.(msg);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let finished = false;

  const dispatch = (event: string, payload: string) => {
    let data: any;
    try {
      data = JSON.parse(payload);
    } catch {
      return;
    }
    switch (event) {
      case "meta":
        handlers.onMeta?.(data);
        break;
      case "delta":
        if (data.text) handlers.onDelta?.(data.text);
        break;
      case "tool_call":
        handlers.onToolCall?.(data);
        break;
      case "tool_result":
        handlers.onToolResult?.(data);
        break;
      case "citation":
        handlers.onCitation?.(data.citacoes ?? []);
        break;
      case "done":
        finished = true;
        handlers.onDone?.(data);
        break;
      case "error":
        finished = true;
        handlers.onError?.(data.message ?? "Erro");
        break;
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      // Eventos separados por linha em branco
      let idx: number;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        let event = "message";
        const dataLines: string[] = [];
        for (const line of raw.split("\n")) {
          const t = line.trim();
          if (!t || t.startsWith(":")) continue;
          if (t.startsWith("event:")) event = t.slice(6).trim();
          else if (t.startsWith("data:")) dataLines.push(t.slice(5).trim());
        }
        if (dataLines.length > 0) dispatch(event, dataLines.join("\n"));
      }
    }
    if (!finished) handlers.onError?.("Conexão interrompida antes do done");
  } catch {
    if (!finished) handlers.onError?.("Conexão interrompida.");
  } finally {
    reader.cancel().catch(() => {});
  }
}
