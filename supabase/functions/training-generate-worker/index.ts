import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  buildTrainingAnalysisPrompt,
  buildTrainingUserPrompt,
  OPENROUTER_MODEL,
  parseStructuredTrainingPlan,
  parseTrainingPeriodizationAnalysis,
  TREINOAI_SYSTEM_PROMPT,
  TRAINING_PERIODIZATION_ANALYSIS_PROMPT,
} from "../_shared/training-plan.ts";
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
      .from("training_prescriptions")
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
      .from("training_prescriptions")
      .update({
        generation_status: "processing",
        error_message: null,
      })
      .eq("id", prescriptionId);

    const payload = (prescription.generation_payload ?? {}) as Record<string, unknown>;

    const generationResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kllprstrjpeedlegkedp.supabase.co",
        "X-Title": "BIOFLUX.AI",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: TREINOAI_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: buildTrainingUserPrompt(payload),
          },
        ],
      }),
    });

    if (!generationResponse.ok) {
      const responseText = await generationResponse.text();
      throw new Error(`Falha ao gerar treino via OpenRouter: ${generationResponse.status} ${responseText}`);
    }

    const generationJson = await generationResponse.json();
    const rawPlanText = getContentAsText(generationJson?.choices?.[0]?.message?.content).trim();

    if (!rawPlanText) {
      throw new Error("O modelo não retornou um plano de treino em texto.");
    }

    const structuredPlan = parseStructuredTrainingPlan(rawPlanText);

    const analysisResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kllprstrjpeedlegkedp.supabase.co",
        "X-Title": "BIOFLUX.AI",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: TRAINING_PERIODIZATION_ANALYSIS_PROMPT,
          },
          {
            role: "user",
            content: buildTrainingAnalysisPrompt(rawPlanText),
          },
        ],
      }),
    });

    if (!analysisResponse.ok) {
      const responseText = await analysisResponse.text();
      throw new Error(`Falha ao analisar periodização via OpenRouter: ${analysisResponse.status} ${responseText}`);
    }

    const analysisJson = await analysisResponse.json();
    const rawAnalysisText = getContentAsText(analysisJson?.choices?.[0]?.message?.content).trim();

    if (!rawAnalysisText) {
      throw new Error("O modelo não retornou análise de periodização.");
    }

    const analysis = parseTrainingPeriodizationAnalysis(rawAnalysisText);

    const updatePayload = {
      generation_status: "completed",
      structured_plan: structuredPlan,
      raw_plan_text: rawPlanText,
      model_slug: OPENROUTER_MODEL,
      error_message: null,
      completed_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseClient
      .from("training_prescriptions")
      .update(updatePayload)
      .eq("id", prescriptionId);

    if (updateError) {
      throw updateError;
    }

    await supabaseClient
      .from("training_periodization")
      .update({ status: "archived" })
      .eq("user_id", prescription.user_id)
      .eq("status", "active");

    await supabaseClient
      .from("training_periodization")
      .delete()
      .eq("training_prescription_id", prescriptionId);

    const { error: periodizationError } = await supabaseClient
      .from("training_periodization")
      .insert({
        user_id: prescription.user_id,
        training_prescription_id: prescriptionId,
        current_objective: analysis.objetivo_treino || structuredPlan.header.objective || "Não informado",
        training_volume:
          analysis.volume_total_series !== null
            ? `${analysis.volume_total_series} séries totais nas 4 semanas`
            : "Não informado",
        intensity: analysis.intensidade_faixa_reps || "Não informado",
        methods: analysis.metodo_utilizado || "Simples",
        workouts: structuredPlan.workouts,
        status: "active",
      });

    if (periodizationError) {
      throw periodizationError;
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
    console.error("Erro em training-generate-worker:", error);

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && serviceRoleKey) {
        const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

        if (prescriptionId) {
          await supabaseClient
            .from("training_prescriptions")
            .update({
              generation_status: "failed",
              error_message: error instanceof Error ? error.message : "Erro desconhecido ao gerar o plano de treino.",
            })
            .eq("id", prescriptionId);
        }
      }
    } catch (loggingError) {
      console.error("Erro secundário ao marcar treino como failed:", loggingError);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao gerar o treino.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
