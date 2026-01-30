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

      // Combine profiles with roles
      const usersWithRoles: UserWithProfile[] = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.user_id);
        return {
          user_id: profile.user_id,
          nome: profile.nome,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          role: (userRole?.role as AppRole) || "viewer",
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

  return {
    users,
    isLoading,
    error,
    updateUserRole,
  };
};
