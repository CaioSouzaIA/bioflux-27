import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  buildDietUserPrompt,
  NUTRIAI_SYSTEM_PROMPT,
  OPENROUTER_MODEL,
  parseStructuredDietPlan,
} from "../_shared/diet-plan.ts";
import { recordAIAgentExecutionLog } from "../_shared/ai-agent-logging.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { loadActivePromptVersion } from "../_shared/prompt-store.ts";

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
  let logContext: {
    userId: string | null;
    formResponseId: string | null;
    promptCommitName: string | null;
  } = {
    userId: null,
    formResponseId: null,
    promptCommitName: null,
  };
  const startedAt = Date.now();

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

    const internalServiceKey = req.headers.get("x-internal-service-key");

    if (internalServiceKey !== serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Chamada interna não autorizada." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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
    logContext.userId = prescription.user_id;
    logContext.formResponseId = prescription.form_response_id;

    const activeDietPrompt = await loadActivePromptVersion(
      supabaseClient,
      "diet_generation",
      NUTRIAI_SYSTEM_PROMPT,
      "initial-diet-prompt",
    );
    logContext.promptCommitName = activeDietPrompt.commitName;

    const requestToModel = {
      model: OPENROUTER_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: activeDietPrompt.promptContent,
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

    await recordAIAgentExecutionLog(supabaseClient, {
      agentKey: "diet_generation",
      agentLabel: "Dieta",
      status: "success",
      sourceFunction: "diet-generate-worker",
      stage: "generation",
      userId: prescription.user_id,
      prescriptionId,
      formResponseId: prescription.form_response_id,
      modelSlug: OPENROUTER_MODEL,
      durationMs: Date.now() - startedAt,
      promptCommitName: activeDietPrompt.commitName,
      metadata: {
        generationStatus: "completed",
      },
      requestPayload: requestToModel as unknown as Record<string, unknown>,
      responsePayload: {
        generationStatus: "completed",
        planName: prescription.plan_name,
      },
    });

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

        await recordAIAgentExecutionLog(supabaseClient, {
          agentKey: "diet_generation",
          agentLabel: "Dieta",
          status: "failed",
          sourceFunction: "diet-generate-worker",
          stage: "generation",
          userId: logContext.userId,
          prescriptionId,
          formResponseId: logContext.formResponseId,
          modelSlug: OPENROUTER_MODEL,
          durationMs: Date.now() - startedAt,
          promptCommitName: logContext.promptCommitName,
          errorMessage: error instanceof Error ? error.message : "Erro desconhecido ao gerar o plano alimentar.",
          metadata: {
            generationStatus: "failed",
          },
        });
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
