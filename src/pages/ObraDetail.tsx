import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePastas, usePastaBreadcrumb } from "@/hooks/usePastas";
import { useArquivos, useMoveArquivo } from "@/hooks/useArquivos";
import { toast } from "sonner";
import { CreatePastaDialog } from "@/components/CreatePastaDialog";
import { UploadArquivoDialog } from "@/components/UploadArquivoDialog";
import { EditObraDialog } from "@/components/EditObraDialog";
import { PastaItem } from "@/components/PastaItem";
import { ArquivoItem } from "@/components/ArquivoItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, Home, ChevronRight, Folder, FileX, LayoutGrid, List, MapPin, Pencil, Building2 } from "lucide-react";
import type { Obra } from "@/hooks/useObras";
const ObraDetail = () => {
  const { obraId, pastaId } = useParams<{ obraId: string; pastaId?: string }>();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);
  const [editObraOpen, setEditObraOpen] = useState(false);
  const moveArquivo = useMoveArquivo();

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
        {/* Header with obra info */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar às Obras
            </Button>
          </Link>
          
          <div className="flex items-start gap-4">
            {/* Obra Photo */}
            <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
              {obra.foto_url ? (
                <img 
                  src={obra.foto_url} 
                  alt={obra.nome} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            
            {/* Obra Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold truncate">{obra.nome}</h1>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setEditObraOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              {obra.endereco && (
                <p className="text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{obra.endereco}</span>
                </p>
              )}
              {obra.descricao && (
                <p className="text-muted-foreground mt-1 line-clamp-2">{obra.descricao}</p>
              )}
            </div>
          </div>
        </div>

        {/* Breadcrumb - also drop target for root */}
        <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              isDragOverRoot 
                ? "bg-primary/10 ring-2 ring-primary ring-dashed" 
                : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (pastaId) setIsDragOverRoot(true);
            }}
            onDragLeave={() => setIsDragOverRoot(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragOverRoot(false);
              if (!pastaId) return; // Already at root
              
              try {
                const data = e.dataTransfer.getData("application/json");
                if (!data) return;
                const { arquivoId, arquivoNome } = JSON.parse(data);
                await moveArquivo.mutateAsync({ id: arquivoId, pastaId: null });
                toast.success(`"${arquivoNome}" movido para a raiz`);
              } catch (error) {
                toast.error("Erro ao mover arquivo");
              }
            }}
          >
            <Link
              to={`/obra/${obraId}`}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Raiz</span>
            </Link>
          </div>
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreatePastaDialog obraId={obraId!} pastaPaiId={pastaId} />
            <UploadArquivoDialog obraId={obraId!} pastaId={pastaId} />
          </div>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "list" | "grid")}
          >
            <ToggleGroupItem value="list" aria-label="Visualização em lista">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Visualização em grade">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
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
                <div
                  className={
                    viewMode === "grid"
                      ? "grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                      : "grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
                  }
                >
                  {arquivos.map((arquivo) => (
                    <ArquivoItem key={arquivo.id} arquivo={arquivo} obraId={obraId!} viewMode={viewMode} />
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

      <EditObraDialog open={editObraOpen} onOpenChange={setEditObraOpen} obra={obra} />
    </div>
  );
};

export default ObraDetail;
