import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceMembros, useToggleWorkspaceMembro } from "@/hooks/useWorkspaces";
import { cn } from "@/lib/utils";

interface WorkspaceMembrosListaProps {
  workspaceId: string;
  /** Só busca quando o container (dialog) está aberto. */
  enabled?: boolean;
}

/** Lista de usuários com switch de acesso ao workspace. Reutilizável em qualquer dialog. */
export function WorkspaceMembrosLista({ workspaceId, enabled = true }: WorkspaceMembrosListaProps) {
  const [search, setSearch] = useState("");
  const { data: membros, isLoading } = useWorkspaceMembros(workspaceId, enabled);
  const toggle = useToggleWorkspaceMembro();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const filtered = (membros ?? []).filter((m) =>
    (m.nome ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar membro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-1 max-h-64 overflow-auto">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-10 ml-auto" />
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((m) => (
            <label
              key={m.user_id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                m.is_gestor ? "cursor-default" : "cursor-pointer hover:bg-muted/50"
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={m.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(m.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.nome || "Sem nome"}</p>
                {m.is_gestor ? (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <BadgeCheck className="h-3 w-3" />
                    {m.gestor_role === "admin" ? "Admin" : "Editor"} (acesso total)
                  </p>
                ) : (
                  m.cargo && <p className="text-xs text-muted-foreground truncate">{m.cargo}</p>
                )}
              </div>
              <Checkbox
                className="h-5 w-5"
                checked={m.is_gestor || m.is_member}
                disabled={m.is_gestor || toggle.isPending}
                onCheckedChange={(checked) =>
                  toggle.mutate(
                    { workspaceId, userId: m.user_id, isMember: checked === true },
                    {
                      onError: (err: any) =>
                        toast.error("Erro ao atualizar membro: " + err.message),
                    }
                  )
                }
              />
            </label>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">Nenhum usuário encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
