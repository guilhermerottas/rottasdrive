import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// --- CORS: domínios prod + qualquer porta de localhost para dev ---
const ALLOWED_ORIGINS = [
  "https://drive.rottasconstrutora.com.br",
];
const LOCALHOST_RE = /^https?:\/\/localhost(:\d+)?$/;

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (LOCALHOST_RE.test(origin)) return true;
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// --- Rate Limiting ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_URL_TTL = 600; // 10 min
const STORAGE_MARKER = "/storage/v1/object/public/arquivos/";

function storagePath(url: string): string | null {
  const idx = url.indexOf(STORAGE_MARKER);
  if (idx < 0) return null;
  return decodeURIComponent(url.slice(idx + STORAGE_MARKER.length));
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...cors },
    });

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(clientIp)) {
      return json({ error: "Muitas requisições. Aguarde um momento." }, 429);
    }

    const { shortCode, pastaId } = await req.json();

    if (!shortCode || typeof shortCode !== "string" || shortCode.length > 32) {
      return json({ error: "Código inválido." }, 400);
    }
    if (pastaId && !UUID_REGEX.test(pastaId)) {
      return json({ error: "Pasta inválida." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Compartilhamento ativo?
    const { data: share, error: shareError } = await admin
      .from("pasta_compartilhamentos")
      .select("pasta_id, ativo, permite_download")
      .eq("short_code", shortCode)
      .eq("ativo", true)
      .maybeSingle();

    if (shareError || !share) {
      return json({ error: "Link não encontrado ou desativado." }, 404);
    }

    const rootPastaId: string = share.pasta_id;

    // Pastas dentro do escopo compartilhado
    const { data: descendentes, error: descError } = await admin.rpc(
      "pasta_share_descendentes",
      { _root_pasta_id: rootPastaId }
    );
    if (descError) throw descError;
    const allowedIds = new Set((descendentes ?? []).map((d: { id: string }) => d.id));

    const currentPastaId: string = pastaId || rootPastaId;
    if (!allowedIds.has(currentPastaId)) {
      return json({ error: "Pasta fora do escopo do link." }, 403);
    }

    // Pasta atual
    const { data: pasta, error: pastaError } = await admin
      .from("pastas")
      .select("id, nome, pasta_pai_id, cor")
      .eq("id", currentPastaId)
      .is("deleted_at", null)
      .maybeSingle();
    if (pastaError || !pasta) {
      return json({ error: "Pasta não encontrada." }, 404);
    }

    // Subpastas
    const { data: subpastas, error: subError } = await admin
      .from("pastas")
      .select("id, nome, cor")
      .eq("pasta_pai_id", currentPastaId)
      .is("deleted_at", null)
      .order("nome");
    if (subError) throw subError;

    // Arquivos
    const { data: arquivos, error: arqError } = await admin
      .from("arquivos")
      .select("id, nome, tipo, tamanho, arquivo_url")
      .eq("pasta_id", currentPastaId)
      .is("deleted_at", null)
      .order("nome");
    if (arqError) throw arqError;

    // URLs assinadas de curta duração
    const paths = (arquivos ?? [])
      .map((a) => storagePath(a.arquivo_url))
      .filter((p): p is string => !!p);

    const signedMap = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed } = await admin.storage
        .from("arquivos")
        .createSignedUrls(paths, SIGNED_URL_TTL);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
      }
    }

    const arquivosOut = (arquivos ?? []).map((a) => {
      const path = storagePath(a.arquivo_url);
      return {
        id: a.id,
        nome: a.nome,
        tipo: a.tipo,
        tamanho: a.tamanho,
        url: path ? signedMap.get(path) ?? null : null,
      };
    });

    return json({
      share: {
        rootPastaId,
        permiteDownload: share.permite_download,
      },
      pasta: {
        id: pasta.id,
        nome: pasta.nome,
        cor: pasta.cor,
        isRoot: pasta.id === rootPastaId,
        pastaPaiId: pasta.id === rootPastaId ? null : pasta.pasta_pai_id,
      },
      subpastas: subpastas ?? [],
      arquivos: arquivosOut,
    });
  } catch (error: any) {
    console.error("public-share error:", error?.message);
    return json({ error: "Erro interno." }, 500);
  }
});
