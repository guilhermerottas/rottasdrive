import { useState } from "react";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useAuthContext } from "@/components/AuthProvider";
import { WorkspaceCard } from "@/components/WorkspaceCard";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import { GlobalSearchResults } from "@/components/GlobalSearchResults";
import { ObraCardSkeleton } from "@/components/skeletons/ObraCardSkeleton";
import { AnimatedMasonry, MasonryItem } from "@/components/AnimatedMasonry";
import { FolderKanban, Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { TutorialPopup } from "@/components/TutorialPopup";

const Index = () => {
  const { data: workspaces, isLoading } = useWorkspaces();
  const { isAdmin } = useAuthContext();
  const [searchValue, setSearchValue] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: searchResults, isLoading: isSearching } = useGlobalSearch(searchValue);
  const isSearchActive = searchValue.length >= 2;

  const filteredWorkspaces = workspaces?.filter((w) =>
    w.nome.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <AppLayout>
      <AppHeader searchValue={searchValue} onSearchChange={setSearchValue} />

      <div className="flex-1 overflow-auto p-3 sm:p-6">
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
                <h1 className="text-2xl font-bold">Workspaces</h1>
                <p className="text-muted-foreground text-sm">
                  Selecione um workspace para ver as coleções
                </p>
              </div>
              {isAdmin && (
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Workspace
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <ObraCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredWorkspaces && filteredWorkspaces.length > 0 ? (
              <AnimatedMasonry
                breakpointCols={{ default: 4, 1536: 4, 1280: 4, 1024: 3, 640: 2, 480: 1 }}
              >
                {filteredWorkspaces.map((workspace, index) => (
                  <MasonryItem key={workspace.id} delay={index * 0.05}>
                    <WorkspaceCard workspace={workspace} />
                  </MasonryItem>
                ))}
              </AnimatedMasonry>
            ) : (
              <div className="text-center py-16">
                <FolderKanban className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Nenhum workspace disponível</h2>
                <p className="text-muted-foreground mb-6">
                  {isAdmin
                    ? "Crie o primeiro workspace para organizar as coleções por setor."
                    : "Você ainda não faz parte de nenhum workspace. Fale com um administrador."}
                </p>
                {isAdmin && (
                  <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Workspace
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <TutorialPopup />
    </AppLayout>
  );
};

export default Index;
