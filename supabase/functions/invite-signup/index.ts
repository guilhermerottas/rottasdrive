import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, token } = await req.json();

    if (!email || !password || !token) {
      return new Response(
        JSON.stringify({ error: "Missing email, password, or token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Este convite expirou." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create user with admin API (auto-confirmed)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { nome: email.split("@")[0] },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Assign viewer role to new user
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userData.user!.id, role: "viewer" });

    if (roleError) {
      console.error("Error assigning viewer role:", roleError);
    }

    // Mark invite as accepted
    await supabaseAdmin
      .from("invites")
      .update({ status: "accepted" })
      .eq("token", token);

    console.log("User created and invite accepted:", userData.user?.id);

    return new Response(
      JSON.stringify({ success: true, user_id: userData.user?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in invite-signup:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
