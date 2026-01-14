import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { useFavoritos } from "@/hooks/useFavoritos";
import { ArquivoItem } from "@/components/ArquivoItem";
import { FileViewer } from "@/components/FileViewer";
import { Arquivo } from "@/hooks/useArquivos";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Columns3, LayoutGrid, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function Favoritos() {
  const [searchValue, setSearchValue] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid" | "masonry">("masonry");
  const [selectedArquivo, setSelectedArquivo] = useState<Arquivo | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const { data: favoritos, isLoading } = useFavoritos();

  const arquivos = favoritos
    ?.map((f) => f.arquivos as unknown as Arquivo)
    .filter(Boolean) || [];

  const filteredArquivos = arquivos.filter((arquivo) =>
    arquivo.nome.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleArquivoClick = (arquivo: Arquivo) => {
    setSelectedArquivo(arquivo);
    setViewerOpen(true);
  };

  return (
    <AppLayout>
      <AppHeader
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                Favoritos
              </h1>
              <p className="text-muted-foreground">
                {arquivos.length} arquivo{arquivos.length !== 1 ? "s" : ""} favoritado{arquivos.length !== 1 ? "s" : ""}
              </p>
            </div>
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

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : filteredArquivos.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchValue ? "Nenhum favorito encontrado" : "Você ainda não tem arquivos favoritos"}
              </p>
            </div>
          ) : (
            <div className={
              viewMode === "masonry"
                ? "columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4"
                : viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "flex flex-col gap-2"
            }>
              {filteredArquivos.map((arquivo) => (
                <ArquivoItem
                  key={arquivo.id}
                  arquivo={arquivo}
                  obraId={arquivo.obra_id}
                  viewMode={viewMode}
                  onView={() => handleArquivoClick(arquivo)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <FileViewer
        arquivo={selectedArquivo}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        arquivos={filteredArquivos}
        onNavigate={setSelectedArquivo}
      />
    </AppLayout>
  );
}
