import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWorkspace } from "@/hooks/useWorkspaces";
import { useObrasByWorkspace } from "@/hooks/useObras";
import { useAuthContext } from "@/components/AuthProvider";
import { ObraCard } from "@/components/ObraCard";
import { CreateObraDialog } from "@/components/CreateObraDialog";
import { ObraCardSkeleton } from "@/components/skeletons/ObraCardSkeleton";
import { AnimatedMasonry, MasonryItem } from "@/components/AnimatedMasonry";
import { Building2, Plus, ChevronLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";

const WorkspaceDetail = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { data: obras, isLoading } = useObrasByWorkspace(workspaceId);
  const { canEdit } = useAuthContext();
  const [searchValue, setSearchValue] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filteredObras = obras?.filter(
    (obra) =>
      obra.nome.toLowerCase().includes(searchValue.toLowerCase()) ||
      obra.endereco?.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (!wsLoading && !workspace) {
    return (
      <AppLayout>
        <AppHeader searchValue="" onSearchChange={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Workspace não encontrado</h1>
            <Link to="/home">
              <Button>Voltar ao início</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AppHeader searchValue={searchValue} onSearchChange={setSearchValue} />

      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <Link to="/home">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar aos Workspaces
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${workspace?.cor || "hsl(var(--primary))"}26` }}
            >
              <Building2
                className="h-6 w-6"
                style={{ color: workspace?.cor || "hsl(var(--primary))" }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">{workspace?.nome || "Workspace"}</h1>
              <p className="text-muted-foreground text-sm">
                {obras?.length || 0}{" "}
                {(obras?.length || 0) === 1 ? "coleção" : "coleções"}
              </p>
            </div>
          </div>
          {canEdit && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Nova Coleção
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <ObraCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredObras && filteredObras.length > 0 ? (
          <AnimatedMasonry
            breakpointCols={{ default: 4, 1536: 4, 1280: 4, 1024: 3, 640: 2, 480: 1 }}
          >
            {filteredObras.map((obra, index) => (
              <MasonryItem key={obra.id} delay={index * 0.05}>
                <ObraCard obra={obra} />
              </MasonryItem>
            ))}
          </AnimatedMasonry>
        ) : (
          <div className="text-center py-16">
            <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma coleção aqui</h2>
            <p className="text-muted-foreground mb-6">
              Crie a primeira coleção deste workspace.
            </p>
            {canEdit && (
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Coleção
              </Button>
            )}
          </div>
        )}
      </div>

      {workspaceId && (
        <CreateObraDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          showTrigger={false}
          workspaceId={workspaceId}
        />
      )}
    </AppLayout>
  );
};

export default WorkspaceDetail;
