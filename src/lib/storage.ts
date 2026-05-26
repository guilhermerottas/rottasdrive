import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_MARKER = "/storage/v1/object/public/arquivos/";
const SIGN_MARKER = "/storage/v1/object/sign/arquivos/";
export const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h
const REFRESH_BEFORE_EXPIRY_MS = 10 * 60 * 1000; // refetch ~10min antes

/**
 * Extrai o caminho dentro do bucket "arquivos" a partir de uma URL pública/assinada.
 * Devolve `null` se a URL não pertencer ao bucket "arquivos".
 */
export function getArquivoStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  // URL já assinada — extrai antes da query string
  const signIdx = url.indexOf(SIGN_MARKER);
  if (signIdx >= 0) {
    const tail = url.slice(signIdx + SIGN_MARKER.length).split("?")[0];
    return decodeURIComponent(tail);
  }
  const pubIdx = url.indexOf(PUBLIC_MARKER);
  if (pubIdx >= 0) {
    return decodeURIComponent(url.slice(pubIdx + PUBLIC_MARKER.length));
  }
  return null;
}

/** Cria uma URL assinada para um caminho dentro do bucket "arquivos". */
export async function signArquivoPath(
  path: string,
  ttl: number = SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("arquivos")
    .createSignedUrl(path, ttl);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Cria URLs assinadas em lote. Mantém a ordem dos caminhos passados. */
export async function signArquivoPaths(
  paths: string[],
  ttl: number = SIGNED_URL_TTL_SECONDS
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  const { data } = await supabase.storage
    .from("arquivos")
    .createSignedUrls(paths, ttl);
  for (const s of data ?? []) {
    if (s.path && s.signedUrl) out.set(s.path, s.signedUrl);
  }
  return out;
}

/**
 * Hook que devolve uma URL assinada a partir de uma URL pública/assinada do bucket
 * "arquivos". Para URLs de outros buckets ou nulas, devolve a string original.
 */
export function useSignedUrl(url: string | null | undefined) {
  const path = getArquivoStoragePath(url);
  const query = useQuery({
    queryKey: ["signed-url", path],
    enabled: !!path,
    staleTime: SIGNED_URL_TTL_SECONDS * 1000 - REFRESH_BEFORE_EXPIRY_MS,
    refetchInterval: SIGNED_URL_TTL_SECONDS * 1000 - REFRESH_BEFORE_EXPIRY_MS,
    refetchOnWindowFocus: false,
    queryFn: () => signArquivoPath(path!),
  });

  if (!path) return { url: url ?? null, isLoading: false } as const;
  return { url: (query.data as string | null) ?? null, isLoading: query.isLoading } as const;
}

/**
 * Hook em lote: recebe uma lista de URLs (pode incluir nulas) e devolve um Map
 * `originalUrl -> signedUrl`. Útil para listas de arquivos/grids.
 */
export function useSignedUrls(urls: Array<string | null | undefined>) {
  const pathsByUrl = new Map<string, string>();
  for (const u of urls) {
    if (!u) continue;
    const p = getArquivoStoragePath(u);
    if (p) pathsByUrl.set(u, p);
  }
  const paths = Array.from(pathsByUrl.values()).sort();
  const key = paths.join("|");

  const query = useQuery({
    queryKey: ["signed-urls", key],
    enabled: paths.length > 0,
    staleTime: SIGNED_URL_TTL_SECONDS * 1000 - REFRESH_BEFORE_EXPIRY_MS,
    refetchInterval: SIGNED_URL_TTL_SECONDS * 1000 - REFRESH_BEFORE_EXPIRY_MS,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const m = await signArquivoPaths(paths);
      const byOriginal = new Map<string, string>();
      for (const [original, p] of pathsByUrl.entries()) {
        const signed = m.get(p);
        if (signed) byOriginal.set(original, signed);
      }
      return byOriginal;
    },
  });

  return {
    get: (url: string | null | undefined): string | null => {
      if (!url) return null;
      // URL fora do bucket "arquivos" — devolve original
      if (!pathsByUrl.has(url)) return url;
      return query.data?.get(url) ?? null;
    },
    isLoading: query.isLoading,
  };
}

/**
 * Para handlers (download/share): obtém uma URL assinada uma única vez,
 * gerando-a sob demanda. Para URLs fora do bucket "arquivos", devolve a original.
 */
export async function resolveArquivoUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const path = getArquivoStoragePath(url);
  if (!path) return url; // não é do bucket arquivos — devolve original
  return signArquivoPath(path);
}
