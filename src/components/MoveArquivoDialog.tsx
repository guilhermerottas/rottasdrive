import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAllPastas, Pasta } from "@/hooks/usePastas";
import { useMoveArquivo } from "@/hooks/useArquivos";
import { toast } from "sonner";
import { Folder, Home, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoveArquivoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arquivoId: string;
  arquivoNome: string;
  obraId: string;
  currentPastaId: string | null;
}

interface PastaTreeItemProps {
  pasta: Pasta;
  allPastas: Pasta[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  level: number;
}

function PastaTreeItem({ pasta, allPastas, selectedId, onSelect, level }: PastaTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const children = allPastas.filter((p) => p.pasta_pai_id === pasta.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === pasta.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(pasta.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-muted-foreground/20 rounded"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Folder className="h-4 w-4 flex-shrink-0" />
        <span className="truncate text-sm">{pasta.nome}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <PastaTreeItem
              key={child.id}
              pasta={child}
              allPastas={allPastas}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MoveArquivoDialog({
  open,
  onOpenChange,
  arquivoId,
  arquivoNome,
  obraId,
  currentPastaId,
}: MoveArquivoDialogProps) {
  const [selectedPastaId, setSelectedPastaId] = useState<string | null>(currentPastaId);
  const { data: allPastas } = useAllPastas(obraId);
  const moveArquivo = useMoveArquivo();

  const rootPastas = allPastas?.filter((p) => p.pasta_pai_id === null) || [];

  const handleMove = async () => {
    if (selectedPastaId === currentPastaId) {
      onOpenChange(false);
      return;
    }

    try {
      await moveArquivo.mutateAsync({ id: arquivoId, pastaId: selectedPastaId });
      toast.success("Arquivo movido com sucesso!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao mover arquivo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mover Arquivo</DialogTitle>
          <DialogDescription>
            Selecione a pasta de destino para "{arquivoNome}"
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[300px] overflow-y-auto border rounded-md p-2">
          {/* Root option */}
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
              selectedPastaId === null ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
            onClick={() => setSelectedPastaId(null)}
          >
            <span className="w-4" />
            <Home className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">Raiz</span>
          </div>

          {/* Pasta tree */}
          {rootPastas.map((pasta) => (
            <PastaTreeItem
              key={pasta.id}
              pasta={pasta}
              allPastas={allPastas || []}
              selectedId={selectedPastaId}
              onSelect={setSelectedPastaId}
              level={1}
            />
          ))}

          {allPastas?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma pasta disponível
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleMove} disabled={moveArquivo.isPending}>
            {moveArquivo.isPending ? "Movendo..." : "Mover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
