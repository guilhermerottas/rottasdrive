import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  user_id: string;
  nome: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type AppRole = "admin" | "editor" | "viewer";

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
  };

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId);
    setRoles((data as UserRole[]) || []);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Check if user is blocked after successful login
    if (data?.user && !error) {
      const { data: isBlocked } = await supabase.rpc("is_user_blocked", {
        _user_id: data.user.id,
      });

      if (isBlocked) {
        await supabase.auth.signOut();
        return {
          data: null,
          error: { message: "Sua conta foi bloqueada. Entre em contato com o administrador." }
        };
      }
    }

    return { data, error };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("profiles")
      .upsert({
        ...updates,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (!error) {
      await fetchProfile(user.id);
    }

    return { error };
  };

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: new Error("Not authenticated"), url: null };

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    // Delete old avatar if exists
    if (profile?.avatar_url) {
      const oldPath = profile.avatar_url.split("/").slice(-2).join("/");
      await supabase.storage.from("avatars").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) return { error: uploadError, url: null };

    const { data: publicUrl } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = `${publicUrl.publicUrl}?t=${Date.now()}`;

    await updateProfile({ avatar_url: avatarUrl });

    return { error: null, url: avatarUrl };
  };

  // Check if user has a specific role
  const hasRole = (role: AppRole) => roles.some((r) => r.role === role);

  // Check if user is admin (level 1)
  const isAdmin = hasRole("admin");

  // Check if user can edit (admin or editor - levels 1 and 2)
  const canEdit = hasRole("admin") || hasRole("editor");

  // Get the user's primary role
  const getUserRole = (): AppRole => {
    if (hasRole("admin")) return "admin";
    if (hasRole("editor")) return "editor";
    return "viewer";
  };

  return {
    user,
    session,
    profile,
    roles,
    loading,
    isAdmin,
    canEdit,
    hasRole,
    getUserRole,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateEmail,
    updatePassword,
    uploadAvatar,
    refetchProfile: () => user && fetchProfile(user.id),
  };
};
