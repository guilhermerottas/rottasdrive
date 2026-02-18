import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Obra } from "@/hooks/useObras";

interface ManageObraAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra: Obra;
}

interface ViewerUser {
  user_id: string;
  nome: string | null;
  avatar_url: string | null;
  is_restricted: boolean;
}

export function ManageObraAccessDialog({ open, onOpenChange, obra }: ManageObraAccessDialogProps) {
  const queryClient = useQueryClient();

  // Fetch viewers (non-admin, non-editor users) and their restriction status for this obra
  const { data: viewers, isLoading } = useQuery({
    queryKey: ["obra-access", obra.id],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, nome, avatar_url");
      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      // Get restrictions for this obra
      const { data: restrictions, error: restrictionsError } = await supabase
        .from("obra_restrictions")
        .select("user_id")
        .eq("obra_id", obra.id);
      if (restrictionsError) throw restrictionsError;

      const restrictedUserIds = new Set(restrictions?.map((r) => r.user_id) || []);

      // Filter to only viewers (not admin/editor)
      const editorRoles = new Set(["admin", "editor"]);
      const roleMap = new Map(roles.map((r) => [r.user_id, r.role]));

      const viewerUsers: ViewerUser[] = profiles
        .filter((p) => {
          const role = roleMap.get(p.user_id) || "viewer";
          return !editorRoles.has(role);
        })
        .map((p) => ({
          user_id: p.user_id,
          nome: p.nome,
          avatar_url: p.avatar_url,
          is_restricted: restrictedUserIds.has(p.user_id),
        }));

      return viewerUsers;
    },
    enabled: open,
  });

  const toggleRestriction = useMutation({
    mutationFn: async ({ userId, restrict }: { userId: string; restrict: boolean }) => {
      if (restrict) {
        const { error } = await supabase
          .from("obra_restrictions")
          .insert({ obra_id: obra.id, user_id: userId, restricted_by: (await supabase.auth.getUser()).data.user?.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("obra_restrictions")
          .delete()
          .eq("obra_id", obra.id)
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obra-access", obra.id] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar acesso: " + error.message);
    },
  });

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Acesso
          </DialogTitle>
          <DialogDescription>
            Controle quais visualizadores podem acessar a obra "{obra.nome}". Admins e Editores sempre têm acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 max-h-80 overflow-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-10 ml-auto" />
              </div>
            ))
          ) : viewers && viewers.length > 0 ? (
            viewers.map((viewer) => (
              <div
                key={viewer.user_id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={viewer.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(viewer.nome)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium truncate">
                  {viewer.nome || "Sem nome"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {viewer.is_restricted ? "Bloqueado" : "Liberado"}
                  </span>
                  <Switch
                    checked={!viewer.is_restricted}
                    onCheckedChange={(checked) =>
                      toggleRestriction.mutate({ userId: viewer.user_id, restrict: !checked })
                    }
                    disabled={toggleRestriction.isPending}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">Nenhum visualizador cadastrado</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
