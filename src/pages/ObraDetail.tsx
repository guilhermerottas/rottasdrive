import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/AuthProvider";
import { usePastas, usePastaBreadcrumb } from "@/hooks/usePastas";
import { useArquivos, useMoveArquivo, Arquivo } from "@/hooks/useArquivos";
import { toast } from "sonner";
import { CreatePastaDialog } from "@/components/CreatePastaDialog";
import { UploadArquivoDialog } from "@/components/UploadArquivoDialog";
import { EditObraDialog } from "@/components/EditObraDialog";
import { PastaItem } from "@/components/PastaItem";
import { PastaListItem } from "@/components/PastaListItem";
import { ArquivoItem } from "@/components/ArquivoItem";
import { ArquivosTableView } from "@/components/ArquivosTableView";
import { FileViewer } from "@/components/FileViewer";
import { SelectionToolbar } from "@/components/SelectionToolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, Home, ChevronRight, Folder, FileX, LayoutGrid, List, MapPin, Pencil, Building2, Columns3 } from "lucide-react";
import type { Obra } from "@/hooks/useObras";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";

const ObraDetail = () => {
  const { obraId, pastaId } = useParams<{ obraId: string; pastaId?: string }>();
  const { canEdit } = useAuthContext();
  const [viewMode, setViewMode] = useState<"list" | "grid" | "masonry">("masonry");
  const [pastaViewMode, setPastaViewMode] = useState<"grid" | "list">("grid");
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);
  const [editObraOpen, setEditObraOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createPastaOpen, setCreatePastaOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedArquivo, setSelectedArquivo] = useState<Arquivo | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  // Filter pastas and arquivos by search
  const filteredPastas = pastas?.filter((pasta) =>
    pasta.nome.toLowerCase().includes(searchValue.toLowerCase())
  );
  const filteredArquivos = arquivos?.filter((arquivo) =>
    arquivo.nome.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback(() => {
    if (filteredArquivos) {
      setSelectedIds(new Set(filteredArquivos.map(a => a.id)));
    }
  }, [filteredArquivos]);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  if (obraLoading) {
    return (
      <AppLayout>
        <AppHeader />
        <div className="flex-1 overflow-auto p-6">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!obra) {
    return (
      <AppLayout>
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Obra não encontrada</h1>
            <Link to="/">
              <Button>Voltar ao início</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AppHeader 
        showUpload={canEdit}
        showNewFolder={canEdit}
        onUploadClick={() => setUploadOpen(true)}
        onNewFolderClick={() => setCreatePastaOpen(true)}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
      
      <div className="flex-1 overflow-auto p-6">
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
            <div className="rounded-xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center shadow-sm" style={{ width: 100, height: 100 }}>
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
                {canEdit && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setEditObraOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
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
              if (!pastaId) return;
              
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
        <div className="flex items-center justify-end mb-6">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "list" | "grid" | "masonry")}
          >
            <ToggleGroupItem value="masonry" aria-label="Visualização Pinterest">
              <Columns3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Visualização em grade">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Visualização em lista">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Pastas */}
            {filteredPastas && filteredPastas.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-muted-foreground">Pastas</h2>
                  <ToggleGroup
                    type="single"
                    value={pastaViewMode}
                    onValueChange={(value) => value && setPastaViewMode(value as "grid" | "list")}
                    className="h-8"
                  >
                    <ToggleGroupItem value="grid" aria-label="Visualização em grade" className="h-7 w-7 p-0">
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="Visualização em lista" className="h-7 w-7 p-0">
                      <List className="h-3.5 w-3.5" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                {pastaViewMode === "grid" ? (
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filteredPastas.map((pasta) => (
                      <PastaItem key={pasta.id} pasta={pasta} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredPastas.map((pasta) => (
                      <PastaListItem key={pasta.id} pasta={pasta} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Arquivos */}
            {filteredArquivos && filteredArquivos.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Arquivos</h2>
                {viewMode === "list" ? (
                  <ArquivosTableView
                    arquivos={filteredArquivos}
                    obraId={obraId!}
                    onView={(arquivo) => {
                      setSelectedArquivo(arquivo);
                      setViewerOpen(true);
                    }}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleSelection}
                    onSelectAll={selectAll}
                    onClearSelection={clearSelection}
                  />
                ) : (
                  <div
                    className={
                      viewMode === "masonry"
                        ? "columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4"
                        : "grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                    }
                  >
                    {filteredArquivos.map((arquivo) => (
                      <ArquivoItem 
                        key={arquivo.id} 
                        arquivo={arquivo} 
                        obraId={obraId!} 
                        viewMode={viewMode}
                        onView={() => {
                          setSelectedArquivo(arquivo);
                          setViewerOpen(true);
                        }}
                        isSelected={isSelected(arquivo.id)}
                        onToggleSelection={() => toggleSelection(arquivo.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {(!filteredPastas || filteredPastas.length === 0) && (!filteredArquivos || filteredArquivos.length === 0) && (
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

      <UploadArquivoDialog obraId={obraId!} pastaId={pastaId} open={uploadOpen} onOpenChange={setUploadOpen} showTrigger={false} />
      <CreatePastaDialog obraId={obraId!} pastaPaiId={pastaId} open={createPastaOpen} onOpenChange={setCreatePastaOpen} showTrigger={false} />
      <EditObraDialog open={editObraOpen} onOpenChange={setEditObraOpen} obra={obra} />
      <FileViewer
        arquivo={selectedArquivo}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        arquivos={filteredArquivos || []}
        onNavigate={setSelectedArquivo}
      />
      <SelectionToolbar
        selectedIds={selectedIds}
        arquivos={filteredArquivos || []}
        onClearSelection={clearSelection}
        onSelectAll={selectAll}
        totalCount={filteredArquivos?.length || 0}
      />
    </AppLayout>
  );
};

export default ObraDetail;
