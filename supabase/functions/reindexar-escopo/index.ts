// Reindexação por escopo: enfileira arquivos pendentes/falhados (ou todos) de uma pasta, obra ou globalmente.
// Body: { workspace_id?, obra_id?, pasta_id?, only_pendente?: boolean (default true) }
// Auth: JWT do usuário. Admin reindex globally; usuário comum precisa de 'add' ou 'editar' no escopo.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const FUNCTIONS_URL = `${SUPABASE_URL.replace(".supabase.co", ".supabase.co")}/functions/v1`;

const MAX_ENQUEUE = 2000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  if (req.method !== "POST") return jsonResp({ error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return jsonResp({ error: "unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return jsonResp({ error: "invalid json" }, 400); }

  const workspaceId: string | null = body?.workspace_id ?? null;
  const obraId: string | null = body?.obra_id ?? null;
  const pastaId: string | null = body?.pasta_id ?? null;
  const onlyPendente: boolean = body?.only_pendente !== false; // default true

  const supaUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const supaSvc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: userRes, error: userErr } = await supaUser.auth.getUser();
  if (userErr || !userRes?.user) return jsonResp({ error: "invalid jwt" }, 401);
  const userId = userRes.user.id;

  // Verificação de permissão
  const isAdmin = await checkAdmin(supaSvc, userId);
  if (!isAdmin) {
    // Reindex global é só admin
    if (!pastaId && !obraId && !workspaceId) {
      return jsonResp({ error: "global reindex requires admin role" }, 403);
    }
    if (pastaId) {
      const hasAcao = await checkPastaPermissao(supaSvc, userId, pastaId);
      if (!hasAcao) return jsonResp({ error: "forbidden: need add/editar on pasta" }, 403);
    } else if (obraId) {
      const canEdit = await checkCanEdit(supaSvc, userId);
      const canAccess = await checkCanAccessObra(supaSvc, userId, obraId);
      if (!canEdit && !canAccess) return jsonResp({ error: "forbidden: cannot access obra" }, 403);
    } else if (workspaceId) {
      const isMember = await checkWorkspaceMember(supaSvc, userId, workspaceId);
      if (!isMember) return jsonResp({ error: "forbidden: not workspace member" }, 403);
    }
  }

  // Monta lista de arquivos no escopo
  const arquivoIds = await buscarArquivosNoEscopo(supaSvc, {
    workspaceId,
    obraId,
    pastaId,
    onlyPendente,
  });

  if (arquivoIds.length === 0) return jsonResp({ enfileirados: 0, message: "nenhum arquivo no escopo" });

  // Reset status pra pendente
  await supaSvc.from("arquivos")
    .update({ status_indexacao: "pendente", indexacao_erro: null })
    .in("id", arquivoIds);

  // Limpa chunks existentes (idempotência ao reindex)
  await supaSvc.from("arquivo_chunks").delete().in("arquivo_id", arquivoIds);

  // Enfileira na pgmq (em lotes)
  for (const aid of arquivoIds) {
    await (supaSvc as any).schema("pgmq").rpc("send", {
      queue_name: "indexacao_jobs",
      message: { arquivo_id: aid },
    });
  }

  // Dispara worker em background (não aguarda) — best-effort
  fireWorker(authHeader).catch((e) => console.error("fire worker:", e));

  return jsonResp({ enfileirados: arquivoIds.length });
});

async function buscarArquivosNoEscopo(supa: any, opts: {
  workspaceId: string | null;
  obraId: string | null;
  pastaId: string | null;
  onlyPendente: boolean;
}): Promise<string[]> {
  if (opts.pastaId) {
    // Recursivo: pasta + descendentes
    const { data: tree, error } = await supa.rpc("pasta_share_descendentes", { _root_pasta_id: opts.pastaId });
    // pasta_share_descendentes retorna jsonb tree, mas se não estiver disponível usamos fallback
    let pastaIds: string[];
    if (!error && tree) {
      pastaIds = extractIdsFromTree(tree);
    } else {
      pastaIds = await pastaDescendentesFallback(supa, opts.pastaId);
    }
    if (pastaIds.length === 0) pastaIds = [opts.pastaId];

    let q = supa.from("arquivos").select("id").is("deleted_at", null).in("pasta_id", pastaIds);
    if (opts.onlyPendente) q = q.in("status_indexacao", ["pendente", "falhou"]);
    const { data, error: e2 } = await q.limit(MAX_ENQUEUE);
    if (e2) throw e2;
    return (data ?? []).map((r: any) => r.id);
  }
  if (opts.obraId) {
    let q = supa.from("arquivos").select("id").is("deleted_at", null).eq("obra_id", opts.obraId);
    if (opts.onlyPendente) q = q.in("status_indexacao", ["pendente", "falhou"]);
    const { data, error } = await q.limit(MAX_ENQUEUE);
    if (error) throw error;
    return (data ?? []).map((r: any) => r.id);
  }
  if (opts.workspaceId) {
    const { data: obras } = await supa.from("obras").select("id").eq("workspace_id", opts.workspaceId);
    const obraIds = (obras ?? []).map((o: any) => o.id);
    if (obraIds.length === 0) return [];
    let q = supa.from("arquivos").select("id").is("deleted_at", null).in("obra_id", obraIds);
    if (opts.onlyPendente) q = q.in("status_indexacao", ["pendente", "falhou"]);
    const { data, error } = await q.limit(MAX_ENQUEUE);
    if (error) throw error;
    return (data ?? []).map((r: any) => r.id);
  }
  // Global (admin)
  let q = supa.from("arquivos").select("id").is("deleted_at", null);
  if (opts.onlyPendente) q = q.in("status_indexacao", ["pendente", "falhou"]);
  const { data, error } = await q.limit(MAX_ENQUEUE);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.id);
}

async function pastaDescendentesFallback(supa: any, rootId: string): Promise<string[]> {
  // CTE recursiva via rpc inline não funciona com supabase-js; faz BFS
  const visited = new Set<string>([rootId]);
  let frontier = [rootId];
  while (frontier.length > 0) {
    const { data } = await supa.from("pastas").select("id, pasta_pai_id").in("pasta_pai_id", frontier);
    const next: string[] = [];
    for (const row of data ?? []) {
      if (!visited.has(row.id)) {
        visited.add(row.id);
        next.push(row.id);
      }
    }
    frontier = next;
    if (visited.size > 5000) break; // safety cap
  }
  return Array.from(visited);
}

function extractIdsFromTree(tree: any): string[] {
  const ids = new Set<string>();
  const walk = (n: any) => {
    if (!n) return;
    if (n.id) ids.add(n.id);
    if (Array.isArray(n.children)) n.children.forEach(walk);
    if (Array.isArray(n)) n.forEach(walk);
  };
  walk(tree);
  return Array.from(ids);
}

async function checkAdmin(supa: any, userId: string): Promise<boolean> {
  const { data } = await supa.rpc("has_role", { _user_id: userId, _role: "admin" });
  return Boolean(data);
}

async function checkCanEdit(supa: any, userId: string): Promise<boolean> {
  const { data } = await supa.rpc("can_edit", { _user_id: userId });
  return Boolean(data);
}

async function checkCanAccessObra(supa: any, userId: string, obraId: string): Promise<boolean> {
  const { data } = await supa.rpc("can_access_obra", { _user_id: userId, _obra_id: obraId });
  return Boolean(data);
}

async function checkPastaPermissao(supa: any, userId: string, pastaId: string): Promise<boolean> {
  const { data } = await supa.rpc("pasta_acoes_efetivas", { _user_id: userId, _pasta_id: pastaId });
  const acoes = (data ?? []) as string[];
  return acoes.includes("add") || acoes.includes("editar");
}

async function checkWorkspaceMember(supa: any, userId: string, workspaceId: string): Promise<boolean> {
  const { data } = await supa.rpc("is_workspace_member", { _user_id: userId, _workspace_id: workspaceId });
  return Boolean(data);
}

async function fireWorker(authHeader: string): Promise<void> {
  // Dispara worker pra puxar da fila; não aguarda resposta
  try {
    await fetch(`${FUNCTIONS_URL}/indexar-arquivo`, {
      method: "POST",
      headers: { "Authorization": authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  } catch {}
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
