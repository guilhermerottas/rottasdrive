import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Validate JWT via getUser() (server-side validation)
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: isAdmin } = await supabaseUser.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Only admins can block users" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const { userId, action } = await req.json();

    // Validate userId as UUID
    if (!userId || !UUID_REGEX.test(userId)) {
      return new Response(
        JSON.stringify({ error: "Invalid userId" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Prevent admin from blocking themselves
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: "You cannot block yourself" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "unblock") {
      const { error: deleteError } = await supabaseAdmin
        .from("blocked_users")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Error unblocking user:", deleteError.message);
        return new Response(
          JSON.stringify({ error: "Failed to unblock user" }),
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "User unblocked successfully" }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Block user flow
    const { error: blockError } = await supabaseAdmin
      .from("blocked_users")
      .insert({
        user_id: userId,
        blocked_by: user.id,
      });

    if (blockError) {
      if (blockError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "User is already blocked" }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
      console.error("Error blocking user:", blockError.message);
      return new Response(
        JSON.stringify({ error: "Failed to block user" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Sign out the user from all sessions
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(userId, "global");
    if (signOutError) {
      console.error("Error signing out user:", signOutError.message);
    }

    return new Response(
      JSON.stringify({ success: true, message: "User blocked and signed out" }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});