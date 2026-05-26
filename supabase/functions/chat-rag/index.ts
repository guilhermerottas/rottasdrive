// Chat RAG: streaming SSE, tool calling (buscar_conteudo, buscar_arquivo), tracking de tokens/custo.
// Body: { conversa_id?, message, workspace_id?, obra_id? }
// Output: SSE eventos `delta` (texto), `tool_call`, `tool_result`, `citation`, `done`, `error`.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const CHAT_MODEL = Deno.env.get("OPENAI_CHAT_MODEL") ?? "gpt-4o-mini";
const EMBED_MODEL = Deno.env.get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small";

const MAX_TOOL_ROUNDS = 3;
const HISTORY_LIMIT = 12;

// Preços OpenAI em USD por 1M tokens. Atualize quando OpenAI mudar.
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "gpt-4o": { input: 2.50, output: 10.00 },
  "gpt-4o-mini-2024-07-18": { input: 0.15, output: 0.60 },
};

const SYSTEM_PROMPT = `Você é o assistente do Rottasdrive, especializado em organizar e responder sobre arquivos de obras de construção civil (PDFs, plantas, contratos, memoriais, fotos, vídeos).

Use as ferramentas disponíveis para responder:
- \`buscar_conteudo\`: para perguntas sobre o CONTEÚDO dos arquivos (ex.: "qual o prazo do contrato?", "o que diz o memorial sobre acabamento?")
- \`buscar_arquivo\`: para LOCALIZAR um arquivo por nome ou descrição (ex.: "onde está a planta do piso 2?", "me dá o link do orçamento")

Regras:
- Sempre cite os arquivos e páginas (quando houver) usados na resposta.
- Se uma busca não retornar resultados, diga "não encontrei nessa obra/workspace" e sugira ampliar o escopo.
- Responda em português, de forma direta e objetiva.
- Não invente: se a informação não está nos arquivos, diga claramente que não está.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "buscar_conteudo",
      description: "Busca dentro do conteúdo dos arquivos (PDFs, transcrições, descrições de imagens) usando RAG semântico+full-text. Retorna trechos com referência a arquivo e página.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "A pergunta ou termo a buscar dentro do conteúdo dos arquivos. Seja específico.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_arquivo",
      description: "Localiza arquivos pelo NOME ou DESCRIÇÃO (não pelo conteúdo). Use quando o usuário quer encontrar/abrir um arquivo específico.",
      parameters: {
        type: "object",
        properties: {
          termo: {
            type: "string",
            description: "Termo da busca: nome aproximado, palavra-chave do título, tipo de documento.",
          },
        },
        required: ["termo"],
      },
    },
  },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return jsonResp({ error: "method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResp({ error: "unauthorized" }, 401);
  }
  const userJwt = authHeader.slice("Bearer ".length);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResp({ error: "invalid json" }, 400);
  }

  const message: string = (body?.message ?? "").trim();
  const workspaceId: string | null = body?.workspace_id ?? null;
  const obraId: string | null = body?.obra_id ?? null;
  let conversaId: string | null = body?.conversa_id ?? null;
  if (!message) return jsonResp({ error: "message is required" }, 400);

  // Cliente "como usuário" — respeita RLS (pra ownership de conversa)
  const supaUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  // Cliente "service" — pra registrar mensagens (já passou pelo check de owner via RLS user) e rodar RPCs
  const supaSvc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Identifica usuário a partir do JWT
  const { data: userRes, error: userErr } = await supaUser.auth.getUser();
  if (userErr || !userRes?.user) {
    return jsonResp({ error: "invalid jwt" }, 401);
  }
  const userId = userRes.user.id;

  // Cria conversa se não existir
  if (!conversaId) {
    const { data: created, error: errCreate } = await supaUser
      .from("chat_conversas")
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        obra_id: obraId,
        titulo: message.slice(0, 60),
      })
      .select("id")
      .single();
    if (errCreate || !created) {
      return jsonResp({ error: "could not create conversation: " + (errCreate?.message ?? "") }, 500);
    }
    conversaId = created.id as string;
  } else {
    // Valida ownership (RLS já bloqueia, mas damos erro claro)
    const { data: conv } = await supaUser
      .from("chat_conversas")
      .select("id")
      .eq("id", conversaId)
      .maybeSingle();
    if (!conv) return jsonResp({ error: "conversation not found" }, 404);
  }

  // Insere mensagem do user
  await supaUser.from("chat_mensagens").insert({
    conversa_id: conversaId,
    role: "user",
    content: message,
  });

  // Carrega histórico (últimas N)
  const { data: histRows } = await supaUser
    .from("chat_mensagens")
    .select("role, content, tool_calls, created_at")
    .eq("conversa_id", conversaId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  const historico = (histRows ?? []).slice().reverse();

  // Monta SSE
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        send("meta", { conversa_id: conversaId });

        // Histórico em formato OpenAI
        const messages: any[] = [
          { role: "system", content: SYSTEM_PROMPT + scopeHint(workspaceId, obraId) },
          ...historico.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
          })),
        ];

        let finalContent = "";
        const citacoes: any[] = [];
        let totalPrompt = 0;
        let totalCompletion = 0;
        let usedModel = CHAT_MODEL;

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: CHAT_MODEL,
              messages,
              tools: TOOLS,
              tool_choice: "auto",
              stream: true,
              stream_options: { include_usage: true },
            }),
          });

          if (!resp.ok || !resp.body) {
            const errTxt = await resp.text();
            send("error", { message: `OpenAI ${resp.status}: ${errTxt.slice(0, 200)}` });
            controller.close();
            return;
          }

          let acc = "";
          const toolCallsAcc: Record<number, { id: string; name: string; argsStr: string }> = {};
          let finishReason: string | null = null;

          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith("data:")) continue;
              const payload = t.slice(5).trim();
              if (payload === "[DONE]") continue;
              let parsed: any;
              try { parsed = JSON.parse(payload); } catch { continue; }
              if (parsed.model) usedModel = parsed.model;
              if (parsed.usage) {
                totalPrompt += parsed.usage.prompt_tokens ?? 0;
                totalCompletion += parsed.usage.completion_tokens ?? 0;
              }
              const choice = parsed.choices?.[0];
              if (!choice) continue;
              if (choice.finish_reason) finishReason = choice.finish_reason;
              const delta = choice.delta ?? {};
              if (delta.content) {
                acc += delta.content;
                send("delta", { text: delta.content });
              }
              if (Array.isArray(delta.tool_calls)) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCallsAcc[idx]) {
                    toolCallsAcc[idx] = { id: tc.id ?? "", name: "", argsStr: "" };
                  }
                  if (tc.id) toolCallsAcc[idx].id = tc.id;
                  if (tc.function?.name) toolCallsAcc[idx].name = tc.function.name;
                  if (tc.function?.arguments) toolCallsAcc[idx].argsStr += tc.function.arguments;
                }
              }
            }
          }

          const toolCalls = Object.values(toolCallsAcc);
          if (toolCalls.length === 0 || finishReason !== "tool_calls") {
            finalContent = acc;
            break;
          }

          // Adiciona mensagem do assistant com tool_calls no histórico
          messages.push({
            role: "assistant",
            content: acc || null,
            tool_calls: toolCalls.map((t) => ({
              id: t.id,
              type: "function",
              function: { name: t.name, arguments: t.argsStr },
            })),
          });

          // Executa cada tool
          for (const tc of toolCalls) {
            let args: any = {};
            try { args = JSON.parse(tc.argsStr || "{}"); } catch { /* ignore */ }
            send("tool_call", { id: tc.id, name: tc.name, args });

            let result: any;
            try {
              if (tc.name === "buscar_conteudo") {
                result = await runBuscarConteudo(supaSvc, args.query ?? "", workspaceId, obraId);
                for (const r of result.results ?? []) {
                  citacoes.push({
                    arquivo_id: r.arquivo_id,
                    nome: r.arquivo_nome,
                    page_number: r.page_number,
                    chunk_id: r.chunk_id,
                  });
                }
                send("citation", { citacoes: result.results });
              } else if (tc.name === "buscar_arquivo") {
                result = await runBuscarArquivo(supaSvc, args.termo ?? "", workspaceId, obraId);
              } else {
                result = { error: `unknown tool: ${tc.name}` };
              }
            } catch (e: any) {
              result = { error: String(e?.message ?? e) };
            }

            send("tool_result", { id: tc.id, name: tc.name, result });
            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(result).slice(0, 12000),
            });
          }
        }

        // Calcula custo
        const price = PRICING[usedModel] ?? PRICING[CHAT_MODEL] ?? { input: 0, output: 0 };
        const costUsd = (totalPrompt * price.input + totalCompletion * price.output) / 1_000_000;

        // Persiste mensagem assistant
        const dedupCitacoes = dedupBy(citacoes, (c) => `${c.arquivo_id}:${c.page_number ?? "_"}`);
        await supaSvc.from("chat_mensagens").insert({
          conversa_id: conversaId,
          role: "assistant",
          content: finalContent,
          citacoes: dedupCitacoes.length ? dedupCitacoes : null,
          model: usedModel,
          prompt_tokens: totalPrompt || null,
          completion_tokens: totalCompletion || null,
          cost_usd: costUsd > 0 ? Number(costUsd.toFixed(6)) : null,
        });

        // Toca updated_at
        await supaSvc.from("chat_conversas")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversaId);

        send("done", {
          conversa_id: conversaId,
          prompt_tokens: totalPrompt,
          completion_tokens: totalCompletion,
          cost_usd: costUsd,
          citacoes: dedupCitacoes,
        });
      } catch (e: any) {
        send("error", { message: String(e?.message ?? e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      ...corsHeaders(),
    },
  });
});

function scopeHint(workspaceId: string | null, obraId: string | null): string {
  if (obraId) return `\n\nEscopo atual: você está dentro de UMA OBRA específica. Suas buscas devem estar dentro dessa obra.`;
  if (workspaceId) return `\n\nEscopo atual: você está dentro de UM WORKSPACE específico. Suas buscas cobrem todas as obras desse workspace.`;
  return `\n\nEscopo atual: nenhum filtro — buscas cobrem tudo que o usuário tem permissão.`;
}

async function runBuscarConteudo(
  supa: any,
  query: string,
  workspaceId: string | null,
  obraId: string | null,
) {
  if (!query.trim()) return { results: [] };
  // Embedding da query
  const respEmb = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: query }),
  });
  if (!respEmb.ok) throw new Error(`embedding ${respEmb.status}`);
  const embData = await respEmb.json();
  const queryEmbedding = embData.data[0].embedding;

  const { data, error } = await supa.rpc("buscar_conteudo_chunks", {
    query_embedding: queryEmbedding,
    query_text: query,
    p_workspace_id: workspaceId,
    p_obra_id: obraId,
    match_count: 8,
  });
  if (error) throw error;
  return { results: data ?? [] };
}

async function runBuscarArquivo(
  supa: any,
  termo: string,
  workspaceId: string | null,
  obraId: string | null,
) {
  if (!termo.trim()) return { results: [] };
  const { data, error } = await supa.rpc("buscar_arquivo_por_nome", {
    termo,
    p_workspace_id: workspaceId,
    p_obra_id: obraId,
    match_count: 5,
  });
  if (error) throw error;
  // Anexa URL do arquivo
  const ids = (data ?? []).map((r: any) => r.arquivo_id);
  if (ids.length === 0) return { results: [] };
  const { data: urls } = await supa
    .from("arquivos")
    .select("id, arquivo_url, tamanho")
    .in("id", ids);
  const urlMap = new Map((urls ?? []).map((u: any) => [u.id, { url: u.arquivo_url, tamanho: u.tamanho }]));
  return {
    results: (data ?? []).map((r: any) => ({
      ...r,
      arquivo_url: urlMap.get(r.arquivo_id)?.url,
      tamanho: urlMap.get(r.arquivo_id)?.tamanho,
    })),
  };
}

function dedupBy<T>(arr: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const k = key(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
