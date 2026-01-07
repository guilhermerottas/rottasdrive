import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePastas, usePastaBreadcrumb } from "@/hooks/usePastas";
import { useArquivos } from "@/hooks/useArquivos";
import { CreatePastaDialog } from "@/components/CreatePastaDialog";
import { UploadArquivoDialog } from "@/components/UploadArquivoDialog";
import { PastaItem } from "@/components/PastaItem";
import { ArquivoItem } from "@/components/ArquivoItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Home, ChevronRight, Folder, FileX } from "lucide-react";
import type { Obra } from "@/hooks/useObras";

const ObraDetail = () => {
  const { obraId, pastaId } = useParams<{ obraId: string; pastaId?: string }>();

  const { data: obra, isLoading: obraLoading } = useQuery({
    queryKey: ["obra", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .eq("id", obraId!)
        .single();
      if (error) throw error;
      return data as Obra;
    },
    enabled: !!obraId,
  });

  const { data: pastas, isLoading: pastasLoading } = usePastas(obraId!, pastaId);
  const { data: arquivos, isLoading: arquivosLoading } = useArquivos(obraId!, pastaId);
  const { data: breadcrumb } = usePastaBreadcrumb(pastaId || null);

  const isLoading = obraLoading || pastasLoading || arquivosLoading;

  if (obraLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Obra não encontrada</h1>
          <Link to="/">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar às Obras
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{obra.nome}</h1>
          {obra.descricao && (
            <p className="text-muted-foreground mt-1">{obra.descricao}</p>
          )}
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap">
          <Link
            to={`/obra/${obraId}`}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Raiz</span>
          </Link>
          {breadcrumb?.map((pasta) => (
            <span key={pasta.id} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Link
                to={`/obra/${obraId}/pasta/${pasta.id}`}
                className={`flex items-center gap-1 ${
                  pasta.id === pastaId
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                } transition-colors`}
              >
                <Folder className="h-4 w-4" />
                <span>{pasta.nome}</span>
              </Link>
            </span>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6">
          <CreatePastaDialog obraId={obraId!} pastaPaiId={pastaId} />
          <UploadArquivoDialog obraId={obraId!} pastaId={pastaId} />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Pastas */}
            {pastas && pastas.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Pastas</h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {pastas.map((pasta) => (
                    <PastaItem key={pasta.id} pasta={pasta} />
                  ))}
                </div>
              </div>
            )}

            {/* Arquivos */}
            {arquivos && arquivos.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Arquivos</h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {arquivos.map((arquivo) => (
                    <ArquivoItem key={arquivo.id} arquivo={arquivo} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!pastas || pastas.length === 0) && (!arquivos || arquivos.length === 0) && (
              <div className="text-center py-16">
                <FileX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Pasta vazia</h2>
                <p className="text-muted-foreground">
                  Crie uma pasta ou faça upload de arquivos para começar.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ObraDetail;
