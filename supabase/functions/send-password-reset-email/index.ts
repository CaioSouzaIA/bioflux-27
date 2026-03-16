import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

const sanitizeOrigin = (origin: string | null | undefined) => {
  if (!origin) {
    return null;
  }

  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.host}`;
  } catch (_error) {
    return null;
  }
};

const buildResetEmailHtml = (resetLink: string) => `
  <div style="margin:0;padding:32px 16px;background:#040404;font-family:Arial,sans-serif;color:#ffffff;">
    <div style="max-width:560px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:24px;">
        <img
          src="https://bioflux-27.vercel.app/lovable-uploads/47b13cc6-5100-44ec-a86b-17a57bac71c6.png"
          alt="BIOFLUX.AI"
          style="max-width:180px;width:100%;height:auto;"
        />
      </div>

      <div style="background:linear-gradient(180deg, rgba(18,18,22,0.96) 0%, rgba(8,8,11,0.96) 100%);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px 24px;box-shadow:0 24px 60px rgba(0,0,0,0.45);">
        <p style="margin:0 0 12px;font-size:24px;font-weight:700;color:#ffffff;text-align:center;">
          Redefinir senha
        </p>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.72);text-align:center;">
          Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha com segurança.
        </p>

        <div style="text-align:center;margin:32px 0;">
          <a
            href="${resetLink}"
            style="display:inline-block;padding:14px 24px;border-radius:999px;background:linear-gradient(135deg, #ffffff 0%, #dffcff 100%);color:#000000;text-decoration:none;font-size:14px;font-weight:700;"
          >
            Criar nova senha
          </a>
        </div>

        <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.55);text-align:center;">
          Se você não solicitou esta alteração, pode ignorar este email com segurança.
        </p>
      </div>
    </div>
  </div>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
    }

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada.");
    }

    const { email, origin } = await req.json();

    if (typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email inválido." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const safeOrigin = sanitizeOrigin(origin) ?? sanitizeOrigin(req.headers.get("origin")) ?? "http://localhost:8080";
    const redirectTo = `${safeOrigin}/reset-password`;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("user not found")) {
        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      throw error;
    }

    const resetLink = data?.properties?.action_link;

    if (!resetLink) {
      throw new Error("Não foi possível gerar o link de recuperação.");
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BIOFLUX <onboarding@resend.dev>",
        to: [email],
        subject: "Recuperação de senha - BIOFLUX",
        html: buildResetEmailHtml(resetLink),
      }),
    });

    if (!resendResponse.ok) {
      const responseText = await resendResponse.text();
      throw new Error(`Falha ao enviar email pelo Resend: ${resendResponse.status} ${responseText}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Erro em send-password-reset-email:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao enviar email de recuperação.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
