import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

import { buildResendAuthEmail } from "../_shared/auth-email.js";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");

const getRequiredSecret = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`${name} não configurado.`);
  }

  return value;
};

const normalizeHookSecret = (value: string) =>
  value.startsWith("v1,whsec_") ? value.replace("v1,whsec_", "") : value;

const parseTemplateAliases = () => ({
  signup: Deno.env.get("RESEND_AUTH_SIGNUP_TEMPLATE_ID") ?? "confirmao-cadastro",
  recovery: Deno.env.get("RESEND_AUTH_RECOVERY_TEMPLATE_ID") ?? "recuperar-senha",
  magiclink: Deno.env.get("RESEND_AUTH_MAGICLINK_TEMPLATE_ID") ?? "",
  invite: Deno.env.get("RESEND_AUTH_INVITE_TEMPLATE_ID") ?? "",
  email_change: Deno.env.get("RESEND_AUTH_EMAIL_CHANGE_TEMPLATE_ID") ?? "",
  reauthentication: Deno.env.get("RESEND_AUTH_REAUTHENTICATION_TEMPLATE_ID") ?? "",
});

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(
      normalizeHookSecret(getRequiredSecret(hookSecret, "SEND_EMAIL_HOOK_SECRET")),
    );

    const verifiedPayload = wh.verify(
      payload,
      headers,
    ) as Parameters<typeof buildResendAuthEmail>[0];
    const message = buildResendAuthEmail(verifiedPayload, {
      supabaseUrl: getRequiredSecret(supabaseUrl, "SUPABASE_URL"),
      fromEmail: Deno.env.get("RESEND_FROM_EMAIL") ?? "app@biofluxapp.com",
      fromName: Deno.env.get("RESEND_FROM_NAME") ?? "BIOFLUX",
      templateAliases: parseTemplateAliases(),
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getRequiredSecret(resendApiKey, "RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Falha ao enviar email pelo Resend: ${response.status} ${responseText}`);
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao enviar email.";

    console.error("Erro em send-email:", message);

    return new Response(
      JSON.stringify({
        error: {
          message,
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
