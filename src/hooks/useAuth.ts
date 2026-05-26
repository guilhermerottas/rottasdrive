import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  user_id: string;
  nome: string | null;
  avatar_url: string | null;
  cargo: string | null;
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
  const fetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchUserData = useCallback(async (userId: string, force = false) => {
    // Skip if already fetched for this user and not forced
    if (!force && fetchedUserIdRef.current === userId) return;
    // Skip if already fetching
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    fetchedUserIdRef.current = userId;

    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("user_roles").select("*").eq("user_id", userId),
      ]);

      setProfile(profileRes.data);
      setRoles((rolesRes.data as UserRole[]) || []);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    // Garante que log_access roda só uma vez por boot do app (evita repetir em token refresh)
    let accessLogged = false;
    const logAccessOnce = () => {
      if (accessLogged) return;
      accessLogged = true;
      supabase.rpc("log_access").then(({ error }) => {
        if (error) {
          console.warn("Falha ao registrar acesso:", error.message);
          accessLogged = false; // permite tentar de novo se falhou
        }
      });
    };

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Registra acesso quando uma sessão é detectada (login novo ou app já logado)
          if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
            logAccessOnce();
          }
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => {
            if (mounted) fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          fetchedUserIdRef.current = null;
          if (event === "SIGNED_OUT") accessLogged = false;
        }
        setLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    // Validate inputs before sending
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || trimmedEmail.length > 255) {
      return { data: null, error: { message: "Email inválido." } };
    }
    if (!password || password.length < 6 || password.length > 128) {
      return { data: null, error: { message: "Senha inválida." } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

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
      // Acesso é registrado via onAuthStateChange (evento SIGNED_IN), não aqui.
    }

    return { data, error };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedNome = nome.trim();
    
    if (!trimmedEmail || trimmedEmail.length > 255) {
      return { data: null, error: { message: "Email inválido." } };
    }
    if (!password || password.length < 6 || password.length > 128) {
      return { data: null, error: { message: "A senha deve ter entre 6 e 128 caracteres." } };
    }
    if (!trimmedNome || trimmedNome.length > 100) {
      return { data: null, error: { message: "Nome inválido." } };
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome: trimmedNome },
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
    fetchedUserIdRef.current = null;
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
      await fetchUserData(user.id, true);
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

  const hasRole = (role: AppRole) => roles.some((r) => r.role === role);
  const isAdmin = hasRole("admin");
  const canEdit = hasRole("admin") || hasRole("editor");

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
    refetchProfile: () => user && fetchUserData(user.id, true),
  };
};
