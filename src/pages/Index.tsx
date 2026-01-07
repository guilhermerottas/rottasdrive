import { useObras } from "@/hooks/useObras";
import { ObraCard } from "@/components/ObraCard";
import { CreateObraDialog } from "@/components/CreateObraDialog";
import { Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: obras, isLoading } = useObras();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Armazenamento Rottas</h1>
          </div>
          <CreateObraDialog />
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : obras && obras.length > 0 ? (
          <div className="space-y-4">
            {obras.map((obra) => (
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
            <CreateObraDialog />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
