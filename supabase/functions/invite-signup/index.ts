import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// --- CORS: restrict to known origins ---
const ALLOWED_ORIGINS = [
  "https://rottasdrive.lovable.app",
  "https://id-preview--27012e3a-a587-4fdf-94d2-3d830603f691.lovable.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// --- Rate Limiting ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

// --- UUID validation ---
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    // Rate limit
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde um momento." }),
        { status: 429, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    const { email, password, token, nome } = await req.json();

    if (!email || !password || !token || !nome) {
      return new Response(
        JSON.stringify({ error: "Missing email, password, token, or nome" }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    // Validate password length
    if (password.length < 6 || password.length > 128) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter entre 6 e 128 caracteres." }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    // Validate token as UUID
    if (!UUID_REGEX.test(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    // Validate nome length
    if (nome.trim().length < 1 || nome.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: "Nome deve ter entre 1 e 100 caracteres." }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invites")
      .select("*")
      .eq("token", token)
      .eq("email", email.trim().toLowerCase())
      .eq("status", "pending")
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: "Convite inválido ou email não corresponde." }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Este convite expirou." }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    // Create user with admin API (auto-confirmed)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { nome: nome.trim() },
    });

    if (createError) {
      console.error("Error creating user:", createError.message);
      return new Response(
        JSON.stringify({ error: "Erro ao criar conta. Tente novamente." }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }

    // Assign viewer role to new user
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userData.user!.id, role: "viewer" });

    if (roleError) {
      console.error("Error assigning viewer role:", roleError.message);
    }

    // Mark invite as accepted
    await supabaseAdmin
      .from("invites")
      .update({ status: "accepted" })
      .eq("token", token);

    return new Response(
      JSON.stringify({ success: true, user_id: userData.user?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...cors } }
    );
  } catch (error: any) {
    console.error("Error in invite-signup:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
});