import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppRole } from "./useAuth";

export interface UserWithProfile {
  user_id: string;
  nome: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole;
  email?: string;
  is_blocked: boolean;
}

export const useAdminUsers = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get all profiles (admins can see all)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Get blocked users
      const { data: blockedUsers, error: blockedError } = await supabase
        .from("blocked_users")
        .select("user_id");

      if (blockedError) throw blockedError;

      const blockedUserIds = new Set(blockedUsers?.map((b) => b.user_id) || []);

      // Combine profiles with roles and blocked status
      const usersWithRoles: UserWithProfile[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.user_id);
        return {
          user_id: profile.user_id,
          nome: profile.nome,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          role: (userRole?.role as AppRole) || "viewer",
          is_blocked: blockedUserIds.has(profile.user_id),
        };
      });

      return usersWithRoles;
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Nível do usuário atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar nível: " + error.message);
    },
  });

  const blockUser = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "block" | "unblock" }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("block-user", {
        body: { userId, action },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      if (variables.action === "block") {
        toast.success("Usuário bloqueado com sucesso!");
      } else {
        toast.success("Usuário desbloqueado com sucesso!");
      }
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  return {
    users,
    isLoading,
    error,
    updateUserRole,
    blockUser,
  };
};
