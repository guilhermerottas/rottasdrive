import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PublicFileViewer } from "@/components/public/PublicFileViewer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Folder from "@/components/Folder";
import logo from "@/assets/logo.png";
import {
  ChevronLeft,
  Download,
  FileText,
  FileX,
  Image as ImageIcon,
  Film,
  Music,
  Loader2,
} from "lucide-react";

interface PublicArquivo {
  id: string;
  nome: string;
  tipo: string | null;
  tamanho: number | null;
  url: string | null;
}
interface PublicSubpasta {
  id: string;
  nome: string;
  cor: string | null;
}
interface PublicShareData {
  share: { rootPastaId: string; permiteDownload: boolean };
  pasta: { id: string; nome: string; cor: string | null; isRoot: boolean; pastaPaiId: string | null };
  subpastas: PublicSubpasta[];
  arquivos: PublicArquivo[];
}

const folderColors: Record<string, string> = {
  default: "#f6942a",
  yellow: "#f9c75e",
  blue: "#427bde",
  gray: "#53575b",
  orange_dark: "#f67425",
  beige: "#eeeeda",
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ tipo }: { tipo: string | null }) {
  const t = tipo || "";
  if (t.startsWith("image/")) return <ImageIcon className="h-10 w-10 text-blue-500" />;
  if (t.startsWith("video/")) return <Film className="h-10 w-10 text-purple-500" />;
  if (t.startsWith("audio/")) return <Music className="h-10 w-10 text-pink-500" />;
  return <FileText className="h-10 w-10 text-muted-foreground" />;
}

const PublicSharePage = () => {
  const { shortCode, pastaId } = useParams<{ shortCode: string; pastaId?: string }>();
  const navigate = useNavigate();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-share", shortCode, pastaId],
    retry: false,
    queryFn: async (): Promise<PublicShareData> => {
      const { data: res, error: fnError } = await supabase.functions.invoke("public-share", {
        body: { shortCode, pastaId: pastaId || null },
      });
      if (fnError) throw new Error("Não foi possível carregar o link.");
      if (res?.error) throw new Error(res.error);
      return res as PublicShareData;
    },
  });

  const goToPasta = (id: string | null) => {
    if (!id || id === data?.share.rootPastaId) navigate(`/arquivos/p/${shortCode}`);
    else navigate(`/arquivos/p/${shortCode}/pasta/${id}`);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <img src={logo} alt="Rottas Drive" className="h-8 w-8 object-contain" />
          <span className="font-bold">Rottas Drive</span>
          <span className="text-xs text-muted-foreground ml-auto">Pasta compartilhada</span>
        </div>
      </header>

      <main
        className="max-w-5xl mx-auto px-4 py-6"
        onContextMenu={(e) => {
          if (data && !data.share.permiteDownload) e.preventDefault();
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p>Carregando arquivos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24 max-w-md mx-auto">
            <FileX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-xl font-semibold mb-2">Este link não está mais disponível</h1>
            <p className="text-muted-foreground">
              O compartilhamento foi desativado pelo responsável e não pode mais ser
              acessado. Para conseguir o conteúdo, entre em contato com quem te enviou o link.
            </p>
          </div>
        ) : data ? (
          <>
            {/* Breadcrumb / título */}
            <div className="mb-6">
              {!data.pasta.isRoot && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-2"
                  onClick={() => goToPasta(data.pasta.pastaPaiId)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar
                </Button>
              )}
              <h1 className="text-2xl font-bold">{data.pasta.nome}</h1>
              <p className="text-sm text-muted-foreground">
                {data.subpastas.length} pasta(s) · {data.arquivos.length} arquivo(s)
                {!data.share.permiteDownload && " · somente visualização"}
              </p>
            </div>

            {/* Subpastas */}
            {data.subpastas.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">Pastas</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {data.subpastas.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => goToPasta(sub.id)}
                      className="flex flex-col items-center justify-center p-4 rounded-xl hover:-translate-y-1 transition-transform"
                    >
                      <Folder color={folderColors[sub.cor || "default"]} size={1} />
                      <span className="text-sm font-medium mt-2 truncate w-full text-center">
                        {sub.nome}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Arquivos */}
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Arquivos</h2>
            {data.arquivos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.arquivos.map((arq, idx) => {
                  const isImage = (arq.tipo || "").startsWith("image/");
                  return (
                    <Card
                      key={arq.id}
                      className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setViewerIndex(idx)}
                    >
                      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        {isImage && arq.url ? (
                          <img
                            src={arq.url}
                            alt={arq.nome}
                            loading="lazy"
                            className="h-full w-full object-cover"
                            draggable={data.share.permiteDownload}
                            onDragStart={(e) => {
                              if (!data.share.permiteDownload) e.preventDefault();
                            }}
                            style={
                              data.share.permiteDownload
                                ? undefined
                                : {
                                    userSelect: "none",
                                    WebkitUserSelect: "none",
                                    WebkitUserDrag: "none",
                                    WebkitTouchCallout: "none",
                                  } as React.CSSProperties
                            }
                          />
                        ) : (
                          <FileIcon tipo={arq.tipo} />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate" title={arq.nome}>
                          {arq.nome}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] text-muted-foreground">
                            {formatBytes(arq.tamanho)}
                          </span>
                          {data.share.permiteDownload && arq.url && (
                            <a
                              href={arq.url}
                              download={arq.nome}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileX className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Nenhum arquivo nesta pasta</p>
              </div>
            )}
          </>
        ) : null}
      </main>

      {data && (
        <PublicFileViewer
          arquivos={data.arquivos}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          permiteDownload={data.share.permiteDownload}
        />
      )}
    </div>
  );
};

export default PublicSharePage;
