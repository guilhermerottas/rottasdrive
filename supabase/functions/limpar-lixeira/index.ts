import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function storagePath(url: string): string | null {
  try {
    const marker = "/storage/v1/object/public/arquivos/";
    const idx = url.indexOf(marker);
    return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length));
  } catch {
    return null;
  }
}

Deno.serve(async (_req: Request) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Busca arquivos expirados (inclui arquivos dentro de pastas expiradas,
  //    pois softDeleteFolderContents seta deleted_at em todos ao mesmo tempo)
  const { data: expiredFiles, error: filesError } = await supabase
    .from("arquivos")
    .select("id, arquivo_url")
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);

  if (filesError) {
    console.error("Erro ao buscar arquivos expirados:", filesError);
    return new Response(JSON.stringify({ ok: false, error: filesError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let removedFiles = 0;

  if (expiredFiles && expiredFiles.length > 0) {
    // Remove arquivos do storage em lotes de 100
    const paths = expiredFiles
      .map((f) => storagePath(f.arquivo_url))
      .filter((p): p is string => p !== null);

    for (let i = 0; i < paths.length; i += 100) {
      const { error: storageErr } = await supabase.storage
        .from("arquivos")
        .remove(paths.slice(i, i + 100));
      if (storageErr) {
        console.error("Erro ao remover do storage (lote", i, "):", storageErr);
      }
    }

    // Remove registros do banco em lotes de 500
    const ids = expiredFiles.map((f) => f.id);
    for (let i = 0; i < ids.length; i += 500) {
      const { error: dbErr } = await supabase
        .from("arquivos")
        .delete()
        .in("id", ids.slice(i, i + 500));
      if (dbErr) {
        console.error("Erro ao deletar arquivos do banco (lote", i, "):", dbErr);
      }
    }

    removedFiles = expiredFiles.length;
  }

  // 2. Deleta pastas expiradas — pasta_pai_id tem ON DELETE CASCADE,
  //    então deletar a raiz já puxa todos os filhos automaticamente.
  //    Deletamos apenas as raízes de cada árvore expirada para evitar
  //    conflito entre linhas que já teriam sido cascadeadas.
  const { data: expiredPastas, error: pastasError } = await supabase
    .from("pastas")
    .select("id, pasta_pai_id")
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);

  if (pastasError) {
    console.error("Erro ao buscar pastas expiradas:", pastasError);
  }

  let removedPastas = 0;

  if (expiredPastas && expiredPastas.length > 0) {
    const expiredIds = new Set(expiredPastas.map((p) => p.id));

    // Pega somente as raízes (pasta_pai_id nulo ou cujo pai NÃO está na lista expirada)
    const roots = expiredPastas
      .filter((p) => !p.pasta_pai_id || !expiredIds.has(p.pasta_pai_id))
      .map((p) => p.id);

    if (roots.length > 0) {
      for (let i = 0; i < roots.length; i += 500) {
        const { error: dbErr } = await supabase
          .from("pastas")
          .delete()
          .in("id", roots.slice(i, i + 500));
        if (dbErr) {
          console.error("Erro ao deletar pastas raiz (lote", i, "):", dbErr);
        }
      }
    }

    removedPastas = expiredPastas.length; // total incluindo cascadeados
  }

  const result = { ok: true, removed_files: removedFiles, removed_pastas: removedPastas };
  console.log("limpar-lixeira concluído:", result);

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
