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
        from: "BIOFLUX <app@biofluxapp.com>",
        to: [email],
        subject: "Recuperação de senha - BIOFLUX",
        template: {
          id: "recuperar-senha",
          variables: {
            reset_link: resetLink,
            reset_url: resetLink,
            resetLink,
            resetUrl: resetLink,
            action_link: resetLink,
            actionLink: resetLink,
            recovery_link: resetLink,
            recoveryLink: resetLink,
            cta_link: resetLink,
            ctaLink: resetLink,
          },
        },
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
