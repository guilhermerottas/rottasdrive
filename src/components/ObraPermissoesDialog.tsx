import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Search, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import type { Obra } from "@/hooks/useObras";
import { PastaAcao, PASTA_ACOES } from "@/hooks/usePastaPermissoes";
import {
  useObraPermissoes,
  useSaveObraPermissoes,
} from "@/hooks/useObraPermissoes";

interface ObraPermissoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra: Obra;
}

export function ObraPermissoesDialog({
  open,
  onOpenChange,
  obra,
}: ObraPermissoesDialogProps) {
  const { data: membros, isLoading } = useObraPermissoes(
    obra.id,
    obra.workspace_id,
    open
  );
  const savePerms = useSaveObraPermissoes();

  const [search, setSearch] = useState("");
  const [state, setState] = useState<Record<string, Set<PastaAcao>>>({});

  useEffect(() => {
    if (membros) {
      const next: Record<string, Set<PastaAcao>> = {};
      for (const m of membros) next[m.user_id] = new Set(m.acoes);
      setState(next);
    }
  }, [membros]);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggle = (userId: string, acao: PastaAcao, checked: boolean) => {
    setState((prev) => {
      const set = new Set(prev[userId] ?? []);
      if (checked) {
        set.add(acao);
        // Qualquer ação implica "ver" — sem ver, não dá pra fazer nada.
        if (acao !== "ver") set.add("ver");
      } else {
        set.delete(acao);
        // Desmarcar "ver" zera tudo.
        if (acao === "ver") set.clear();
      }
      return { ...prev, [userId]: set };
    });
  };

  const filtered = useMemo(
    () =>
      (membros ?? []).filter((m) =>
        (m.nome ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [membros, search]
  );

  const handleSave = async () => {
    if (!membros) return;
    const payload = membros
      .filter((m) => !m.is_gestor)
      .map((m) => ({
        user_id: m.user_id,
        acoes: Array.from(state[m.user_id] ?? new Set<PastaAcao>()),
      }));
    try {
      await savePerms.mutateAsync({ obraId: obra.id, membros: payload });
      toast.success("Permissões da coleção salvas!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao salvar permissões: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Permissões da coleção
          </DialogTitle>
          <DialogDescription>{obra.nome}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted/50 border px-3 py-2 text-xs text-muted-foreground">
          Membros do workspace podem <strong>visualizar e baixar</strong> por padrão.
          Esta matriz vira o <strong>padrão das pastas</strong> desta coleção — pastas
          com permissões próprias sobrescrevem.
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar membro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[55vh] overflow-auto">
          <div className="grid grid-cols-[1fr_repeat(6,3rem)] items-center gap-1 px-2 pb-2 text-[11px] font-medium text-muted-foreground uppercase border-b">
            <span>Membro</span>
            {PASTA_ACOES.map((a) => (
              <span key={a.value} className="text-center">
                {a.label}
              </span>
            ))}
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((m) => (
              <div
                key={m.user_id}
                className="grid grid-cols-[1fr_repeat(6,3rem)] items-center gap-1 px-2 py-2 border-b last:border-0 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(m.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.nome || "Sem nome"}
                    </p>
                    {m.is_gestor ? (
                      <p className="text-xs text-primary flex items-center gap-1">
                        <BadgeCheck className="h-3 w-3" />
                        {m.gestor_role === "admin" ? "Admin" : "Editor"} (acesso total)
                      </p>
                    ) : (
                      m.cargo && (
                        <p className="text-xs text-muted-foreground truncate">
                          {m.cargo}
                        </p>
                      )
                    )}
                  </div>
                </div>
                {PASTA_ACOES.map((a) => {
                  const checked =
                    m.is_gestor || (state[m.user_id]?.has(a.value) ?? false);
                  return (
                    <div key={a.value} className="flex justify-center">
                      <Checkbox
                        checked={checked}
                        disabled={m.is_gestor || savePerms.isPending}
                        onCheckedChange={(c) => toggle(m.user_id, a.value, c === true)}
                      />
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum membro encontrado
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading || savePerms.isPending}>
            {savePerms.isPending ? "Salvando..." : "Salvar permissões"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
