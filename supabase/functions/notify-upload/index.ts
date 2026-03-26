import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface NotifyRequest {
  obraId: string;
  obraNome: string;
  pastaNome: string | null;
  arquivos: { nome: string }[];
  uploaderName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { obraId, obraNome, pastaNome, arquivos, uploaderName }: NotifyRequest = await req.json();

    // Validate inputs
    if (!obraId || !obraNome || !arquivos || !Array.isArray(arquivos) || arquivos.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Limit array size to prevent abuse
    const limitedArquivos = arquivos.slice(0, 50);

    // Get restricted user IDs for this obra
    const { data: restrictions } = await supabase
      .from("obra_restrictions")
      .select("user_id")
      .eq("obra_id", obraId);

    const restrictedUserIds = new Set((restrictions || []).map((r: any) => r.user_id));

    // Get all users from auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw usersError;

    // Filter out restricted users and collect emails
    const emails = (users || [])
      .filter((u: any) => !restrictedUserIds.has(u.id) && u.email)
      .map((u: any) => u.email);

    if (emails.length === 0) {
      return new Response(JSON.stringify({ message: "No recipients" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Escape all user-provided content for HTML
    const safeObraNome = escapeHtml(obraNome);
    const safeUploaderName = escapeHtml(uploaderName || "Usuário");
    const safePastaNome = pastaNome ? escapeHtml(pastaNome) : null;

    const fileList = limitedArquivos.map((a) => `<li>${escapeHtml(a.nome)}</li>`).join("");
    const pastaInfo = safePastaNome ? `<p><strong>Pasta:</strong> ${safePastaNome}</p>` : "";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">📁 Novos Arquivos Adicionados</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px;">
            <strong>${safeUploaderName}</strong> adicionou ${limitedArquivos.length} arquivo(s) na obra:
          </p>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 16px 0;">
            <strong style="color: #92400e; font-size: 18px;">${safeObraNome}</strong>
          </div>
          ${pastaInfo ? `<div style="margin: 12px 0; color: #4b5563;">${pastaInfo}</div>` : ""}
          <p style="color: #374151; font-weight: 600; margin-top: 16px;">Arquivos:</p>
          <ul style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
            ${fileList}
          </ul>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Armazenamento Rottas — Notificação automática
          </p>
        </div>
      </div>
    `;

    // Send email using Resend
    const sandboxRecipient = "tecnologia@rottasconstrutora.com.br";
    
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Armazenamento Rottas <onboarding@resend.dev>",
        to: [sandboxRecipient],
        subject: `📁 Novos arquivos em "${safeObraNome}"`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to send email");
    }

    await res.json();

    return new Response(JSON.stringify({ success: true, recipients: emails.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-upload:", error.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);