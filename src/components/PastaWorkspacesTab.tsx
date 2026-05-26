import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useObrasByWorkspace } from "@/hooks/useObras";
import {
  usePastaVinculos,
  useSetPastaVinculos,
  VinculoAlvo,
} from "@/hooks/usePastaVinculos";
import { getWorkspaceIcon } from "@/components/workspaceIcons";

interface Props {
  pastaId: string;
  homeWorkspaceId: string;
  onClose: () => void;
}

interface RowState {
  enabled: boolean;
  obraId: string | "";
}

function WorkspaceRow({
  workspaceId,
  workspaceNome,
  workspaceCor,
  workspaceIcone,
  state,
  onChange,
}: {
  workspaceId: string;
  workspaceNome: string;
  workspaceCor: string | null;
  workspaceIcone: string | null;
  state: RowState;
  onChange: (next: RowState) => void;
}) {
  const { data: obras, isLoading } = useObrasByWorkspace(
    state.enabled ? workspaceId : undefined
  );
  const Icon = getWorkspaceIcon(workspaceIcone);

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon
            className="h-4 w-4 shrink-0"
            style={{ color: workspaceCor ?? undefined }}
          />
          <span className="font-medium truncate">{workspaceNome}</span>
        </div>
        <Switch
          checked={state.enabled}
          onCheckedChange={(checked) =>
            onChange({ enabled: checked, obraId: checked ? state.obraId : "" })
          }
        />
      </div>

      {state.enabled && (
        <div>
          {isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (obras ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Este workspace não tem obras.
            </p>
          ) : (
            <Select
              value={state.obraId}
              onValueChange={(v) => onChange({ enabled: true, obraId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma obra de destino" />
              </SelectTrigger>
              <SelectContent>
                {(obras ?? []).map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}

export function PastaWorkspacesTab({ pastaId, homeWorkspaceId, onClose }: Props) {
  const { data: workspaces, isLoading: wsLoading } = useWorkspaces();
  const { data: vinculos, isLoading: vinculosLoading } = usePastaVinculos(pastaId);
  const setVinculos = useSetPastaVinculos();

  const [rows, setRows] = useState<Record<string, RowState>>({});

  useEffect(() => {
    if (!vinculos) return;
    const map: Record<string, RowState> = {};
    for (const v of vinculos) {
      map[v.workspace_destino_id] = {
        enabled: true,
        obraId: v.obra_destino_id,
      };
    }
    setRows(map);
  }, [vinculos]);

  const otherWorkspaces = useMemo(
    () => (workspaces ?? []).filter((w) => w.id !== homeWorkspaceId),
    [workspaces, homeWorkspaceId]
  );

  const homeWorkspace = useMemo(
    () => (workspaces ?? []).find((w) => w.id === homeWorkspaceId),
    [workspaces, homeWorkspaceId]
  );

  const handleSave = async () => {
    const alvos: VinculoAlvo[] = Object.entries(rows)
      .filter(([, s]) => s.enabled && !!s.obraId)
      .map(([wsId, s]) => ({ workspaceId: wsId, obraId: s.obraId as string }));

    // Validação: se ligou um workspace mas não escolheu obra, alerta.
    const incompletos = Object.entries(rows).filter(
      ([, s]) => s.enabled && !s.obraId
    );
    if (incompletos.length > 0) {
      toast.error("Escolha uma obra de destino para cada workspace selecionado.");
      return;
    }

    try {
      await setVinculos.mutateAsync({ pastaId, alvos });
      toast.success("Vínculos atualizados!");
      onClose();
    } catch (err: any) {
      toast.error("Erro ao salvar vínculos: " + (err?.message ?? "desconhecido"));
    }
  };

  const isLoading = wsLoading || vinculosLoading;

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-muted/50 border px-3 py-2 text-xs text-muted-foreground">
        Vincule esta pasta a obras de <strong>outros workspaces</strong>. A pasta
        passa a aparecer na raiz da obra escolhida — sem duplicar arquivos.
        Permissões em cada workspace são <strong>independentes</strong>.
      </div>

      {homeWorkspace && (
        <div className="border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {(() => {
                const Icon = getWorkspaceIcon(homeWorkspace.icone);
                return (
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: homeWorkspace.cor ?? undefined }}
                  />
                );
              })()}
              <span className="font-medium truncate">{homeWorkspace.nome}</span>
            </div>
            <span className="text-xs text-primary flex items-center gap-1">
              <BadgeCheck className="h-3 w-3" />
              Origem
            </span>
          </div>
        </div>
      )}

      <div className="max-h-[45vh] overflow-auto space-y-2 pr-1">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))
        ) : otherWorkspaces.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Você não tem acesso a outros workspaces para compartilhar.
          </p>
        ) : (
          otherWorkspaces.map((w) => (
            <WorkspaceRow
              key={w.id}
              workspaceId={w.id}
              workspaceNome={w.nome}
              workspaceCor={w.cor}
              workspaceIcone={w.icone}
              state={rows[w.id] ?? { enabled: false, obraId: "" }}
              onChange={(next) => setRows((p) => ({ ...p, [w.id]: next }))}
            />
          ))
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} disabled={setVinculos.isPending}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading || setVinculos.isPending}>
          {setVinculos.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          Salvar vínculos
        </Button>
      </div>
    </div>
  );
}
