// Worker de indexação: extrai texto/transcrição/visão de um arquivo, gera embeddings e grava em arquivo_chunks.
// Invocação: POST { arquivo_id } (chama direto) OU sem body (puxa N jobs da queue pgmq).
// Usa service_role — bypassa RLS.

import { createClient } from "@supabase/supabase-js";
import { extractText } from "unpdf";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const EMBED_MODEL = Deno.env.get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small";
const VISION_MODEL = Deno.env.get("OPENAI_VISION_MODEL") ?? "gpt-4o-mini";

const MAX_BATCH_JOBS = 5;
const MAX_CHARS_PER_CHUNK = 2000;
const CHUNK_OVERLAP_CHARS = 200;
const MAX_CHUNKS_PER_FILE = 800;
const EMBED_BATCH_SIZE = 64;
const WHISPER_MAX_BYTES = 25 * 1024 * 1024;
const SCANNED_PDF_MIN_TEXT = 50;

const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface ArquivoRow {
  id: string;
  nome: string;
  tipo: string | null;
  arquivo_url: string;
  obra_id: string;
  pasta_id: string | null;
  tamanho: number | null;
  descricao: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const body = req.method === "POST" ? await safeJson(req) : {};
    const arquivoIds: string[] = [];

    if (body?.arquivo_id) {
      arquivoIds.push(body.arquivo_id);
    } else {
      const { data: msgs, error } = await (supa as any).schema("pgmq").rpc(
        "read",
        { queue_name: "indexacao_jobs", vt: 300, qty: MAX_BATCH_JOBS },
      );
      if (error) console.error("pgmq.read:", error);
      for (const msg of msgs ?? []) {
        const aid = msg?.message?.arquivo_id;
        if (aid) arquivoIds.push(aid);
      }
    }

    if (arquivoIds.length === 0) {
      return json({ processed: 0, message: "no jobs" });
    }

    const results = [] as any[];
    for (const aid of arquivoIds) {
      const r = await processarArquivo(aid);
      results.push({ arquivo_id: aid, ...r });
    }
    return json({ processed: results.length, results });
  } catch (e: any) {
    console.error("worker fatal:", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

async function processarArquivo(arquivoId: string): Promise<{ ok: boolean; chunks?: number; error?: string }> {
  await supa.from("arquivos")
    .update({ status_indexacao: "processando", indexacao_erro: null })
    .eq("id", arquivoId);

  try {
    const { data: arq, error: errArq } = await supa
      .from("arquivos")
      .select("id, nome, tipo, arquivo_url, obra_id, pasta_id, tamanho, descricao")
      .eq("id", arquivoId)
      .is("deleted_at", null)
      .maybeSingle();
    if (errArq) throw errArq;
    if (!arq) throw new Error("arquivo não encontrado ou deletado");

    const mime = ((arq as ArquivoRow).tipo ?? "").toLowerCase();
    const extraidos = await extrairConteudo(arq as ArquivoRow, mime);

    if (extraidos.tipo === "nao_aplicavel") {
      await supa.from("arquivos")
        .update({ status_indexacao: "nao_aplicavel", indexado_em: new Date().toISOString() })
        .eq("id", arquivoId);
      return { ok: true, chunks: 0 };
    }

    await supa.from("arquivo_chunks").delete().eq("arquivo_id", arquivoId);

    const chunks = chunkPages(extraidos.pages, extraidos.source);
    if (chunks.length === 0) {
      throw new Error("nenhum texto extraído");
    }
    if (chunks.length > MAX_CHUNKS_PER_FILE) {
      chunks.length = MAX_CHUNKS_PER_FILE;
    }

    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const slice = chunks.slice(i, i + EMBED_BATCH_SIZE);
      const embs = await embedBatch(slice.map((c) => c.content));
      for (let j = 0; j < slice.length; j++) {
        slice[j].embedding = embs[j];
      }
    }

    const rows = chunks.map((c, idx) => ({
      arquivo_id: arquivoId,
      chunk_index: idx,
      content: c.content,
      embedding: c.embedding,
      page_number: c.page,
      source: c.source,
      metadata: c.metadata ?? {},
    }));
    for (let i = 0; i < rows.length; i += 200) {
      const slice = rows.slice(i, i + 200);
      const { error } = await supa.from("arquivo_chunks").insert(slice);
      if (error) throw error;
    }

    await supa.from("arquivos")
      .update({
        status_indexacao: "indexado",
        indexado_em: new Date().toISOString(),
        indexacao_erro: null,
        paginas_total: extraidos.totalPages ?? null,
      })
      .eq("id", arquivoId);

    return { ok: true, chunks: rows.length };
  } catch (e: any) {
    const msg = String(e?.message ?? e).slice(0, 500);
    console.error(`indexar ${arquivoId}:`, msg);
    await supa.from("arquivos")
      .update({ status_indexacao: "falhou", indexacao_erro: msg })
      .eq("id", arquivoId);
    return { ok: false, error: msg };
  }
}

type ChunkSource = "pdf_text" | "pdf_ocr" | "transcription" | "vision" | "plaintext";

type ExtractResult =
  | { tipo: "nao_aplicavel" }
  | { tipo: "ok"; pages: { page: number | null; text: string }[]; source: ChunkSource; totalPages: number | null };

async function extrairConteudo(arq: ArquivoRow, mime: string): Promise<ExtractResult> {
  const url = arq.arquivo_url;

  if (mime === "application/pdf" || arq.nome.toLowerCase().endsWith(".pdf")) {
    const bytes = await fetchBytes(url);
    const result: any = await extractText(new Uint8Array(bytes), { mergePages: false });
    const pagesArr: string[] = Array.isArray(result.text) ? result.text : [String(result.text ?? "")];
    const totalText = pagesArr.join("").trim();
    if (totalText.length < SCANNED_PDF_MIN_TEXT) {
      throw new Error("PDF parece escaneado (sem texto extraível). OCR de PDF fica para V2.");
    }
    return {
      tipo: "ok",
      source: "pdf_text",
      totalPages: result.totalPages ?? pagesArr.length,
      pages: pagesArr.map((t, i) => ({ page: i + 1, text: (t ?? "").trim() })).filter((p) => p.text.length > 0),
    };
  }

  if (mime.startsWith("text/") || /\.(md|txt|markdown)$/i.test(arq.nome)) {
    const bytes = await fetchBytes(url);
    const text = new TextDecoder("utf-8").decode(bytes).trim();
    if (!text) throw new Error("arquivo de texto vazio");
    return { tipo: "ok", source: "plaintext", totalPages: null, pages: [{ page: null, text }] };
  }

  if (mime.startsWith("image/")) {
    const description = await visionDescribe(url);
    if (!description.trim()) throw new Error("vision não retornou descrição");
    return {
      tipo: "ok",
      source: "vision",
      totalPages: null,
      pages: [{ page: null, text: `[Imagem: ${arq.nome}]\n${description}` }],
    };
  }

  if (mime.startsWith("audio/") || mime.startsWith("video/")) {
    if ((arq.tamanho ?? 0) > WHISPER_MAX_BYTES) {
      throw new Error(`arquivo > 25 MB — transcrição de mídia grande fica para V2 (split de áudio)`);
    }
    const transcript = await whisperTranscribe(url, arq.nome);
    if (!transcript.trim()) throw new Error("whisper não retornou transcrição");
    return { tipo: "ok", source: "transcription", totalPages: null, pages: [{ page: null, text: transcript }] };
  }

  return { tipo: "nao_aplicavel" };
}

interface PendingChunk {
  content: string;
  page: number | null;
  source: ChunkSource;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

function chunkPages(pages: { page: number | null; text: string }[], source: ChunkSource): PendingChunk[] {
  const out: PendingChunk[] = [];
  for (const p of pages) {
    const paras = p.text.split(/\n\s*\n+/g).map((s) => s.trim()).filter(Boolean);
    let buf = "";
    for (const para of paras) {
      if ((buf + "\n\n" + para).length > MAX_CHARS_PER_CHUNK && buf) {
        out.push({ content: buf, page: p.page, source });
        buf = buf.slice(-CHUNK_OVERLAP_CHARS) + "\n\n" + para;
      } else {
        buf = buf ? buf + "\n\n" + para : para;
      }
    }
    if (buf) out.push({ content: buf, page: p.page, source });
  }
  return out;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI embeddings ${resp.status}: ${err.slice(0, 200)}`);
  }
  const data = await resp.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

async function visionDescribe(imageUrl: string): Promise<string> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Descreva detalhadamente o conteúdo desta imagem de uma obra de construção civil. Inclua textos visíveis, números, medidas, identificações de planta, e qualquer informação relevante para localizar ou entender a imagem. Responda em português.",
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 800,
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI vision ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function whisperTranscribe(url: string, filename: string): Promise<string> {
  const bytes = await fetchBytes(url);
  const form = new FormData();
  form.append("file", new Blob([bytes]), filename);
  form.append("model", "whisper-1");
  form.append("language", "pt");
  form.append("response_format", "text");
  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  if (!resp.ok) throw new Error(`OpenAI whisper ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  return await resp.text();
}

async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`download falhou: ${resp.status}`);
  return await resp.arrayBuffer();
}

async function safeJson(req: Request): Promise<any> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function json(body: unknown, status = 200): Response {
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
