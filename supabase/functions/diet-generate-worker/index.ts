import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  buildDietUserPrompt,
  NUTRIAI_SYSTEM_PROMPT,
  OPENROUTER_MODEL,
  parseStructuredDietPlan,
} from "../_shared/diet-plan.ts";
import { corsHeaders } from "../_shared/cors.ts";

const getContentAsText = (content: unknown) => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (part && typeof part === "object" && "text" in part) {
          return String(part.text ?? "");
        }

        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let prescriptionId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
    }

    if (!openRouterApiKey) {
      throw new Error("OPENROUTER_API_KEY não configurada.");
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json();
    prescriptionId = body?.prescriptionId ?? null;

    if (!prescriptionId) {
      return new Response(
        JSON.stringify({ error: "prescriptionId é obrigatório." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: prescription, error: prescriptionError } = await supabaseClient
      .from("diet_prescriptions")
      .select("*")
      .eq("id", prescriptionId)
      .maybeSingle();

    if (prescriptionError) {
      throw prescriptionError;
    }

    if (!prescription) {
      return new Response(
        JSON.stringify({ error: "Prescrição não encontrada." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    await supabaseClient
      .from("diet_prescriptions")
      .update({
        generation_status: "processing",
        error_message: null,
      })
      .eq("id", prescriptionId);

    const payload = (prescription.generation_payload ?? {}) as Record<string, unknown>;

    const requestToModel = {
      model: OPENROUTER_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: NUTRIAI_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildDietUserPrompt(payload),
        },
      ],
    };

    const modelResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kllprstrjpeedlegkedp.supabase.co",
        "X-Title": "BIOFLUX.AI",
      },
      body: JSON.stringify(requestToModel),
    });

    if (!modelResponse.ok) {
      const responseText = await modelResponse.text();
      throw new Error(`Falha ao gerar plano via OpenRouter: ${modelResponse.status} ${responseText}`);
    }

    const responseJson = await modelResponse.json();
    const rawPlanText = getContentAsText(responseJson?.choices?.[0]?.message?.content).trim();

    if (!rawPlanText) {
      throw new Error("O modelo não retornou um plano alimentar em texto.");
    }

    const structuredPlan = parseStructuredDietPlan(rawPlanText);

    const updatePayload = {
      generation_status: "completed",
      structured_plan: structuredPlan,
      raw_plan_text: rawPlanText,
      model_slug: OPENROUTER_MODEL,
      error_message: null,
      completed_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseClient
      .from("diet_prescriptions")
      .update(updatePayload)
      .eq("id", prescriptionId);

    if (updateError) {
      throw updateError;
    }

    if (prescription.form_response_id) {
      await supabaseClient
        .from("form_responses")
        .update({
          plano_alimentar: rawPlanText,
        })
        .eq("id", prescription.form_response_id);
    }

    return new Response(
      JSON.stringify({
        prescriptionId,
        generation_status: "completed",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Erro em diet-generate-worker:", error);

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && serviceRoleKey) {
        const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

        if (prescriptionId) {
          await supabaseClient
            .from("diet_prescriptions")
            .update({
              generation_status: "failed",
              error_message: error instanceof Error ? error.message : "Erro desconhecido ao gerar o plano alimentar.",
            })
            .eq("id", prescriptionId);
        }
      }
    } catch (loggingError) {
      console.error("Erro secundário ao marcar prescrição como failed:", loggingError);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao gerar a dieta.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
