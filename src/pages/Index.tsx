import { useState } from "react";
import { useObras } from "@/hooks/useObras";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useAuthContext } from "@/components/AuthProvider";
import { ObraCard } from "@/components/ObraCard";
import { CreateObraDialog } from "@/components/CreateObraDialog";
import { GlobalSearchResults } from "@/components/GlobalSearchResults";
import { Building2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data: obras, isLoading } = useObras();
  const { canEdit } = useAuthContext();
  const [searchValue, setSearchValue] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: searchResults, isLoading: isSearching } = useGlobalSearch(searchValue);
  const isSearchActive = searchValue.length >= 2;

  const filteredObras = obras?.filter((obra) =>
    obra.nome.toLowerCase().includes(searchValue.toLowerCase()) ||
    obra.endereco?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <AppLayout>
      <AppHeader 
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
      
      <div className="flex-1 overflow-auto p-6">
        {isSearchActive ? (
          <GlobalSearchResults
            results={searchResults || []}
            isLoading={isSearching}
            searchTerm={searchValue}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Obras</h1>
                <p className="text-muted-foreground text-sm">
                  Total: {obras?.length || 0} obras
                </p>
              </div>
              {canEdit && (
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Obra
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredObras && filteredObras.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredObras.map((obra) => (
                  <ObraCard key={obra.id} obra={obra} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Nenhuma obra cadastrada</h2>
                <p className="text-muted-foreground mb-6">
                  Comece criando sua primeira obra para organizar seus arquivos.
                </p>
                {canEdit && (
                  <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Obra
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <CreateObraDialog open={createOpen} onOpenChange={setCreateOpen} showTrigger={false} />
    </AppLayout>
  );
};

export default Index;
