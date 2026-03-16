import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { recordAIAgentExecutionLog } from "../_shared/ai-agent-logging.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { resolveTrainingGenerationAgent } from "../_shared/training-plan.ts";

const METABOLIC_ASSESSMENT_MAX_AGE_DAYS = 30;
const FREE_PLAN_NAME = "Free - Teste";

const runTrainingGenerateWorker = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  prescriptionId: string,
) => {
  const workerResponse = await fetch(`${supabaseUrl}/functions/v1/training-generate-worker`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ prescriptionId }),
  });

  const responseText = await workerResponse.text();
  const responseJson = responseText ? JSON.parse(responseText) : null;

  if (!workerResponse.ok) {
    throw new Error(
      responseJson?.error ||
        `Falha ao disparar training-generate-worker: ${workerResponse.status} ${responseText}`,
    );
  }

  return responseJson;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  let logBody: Record<string, unknown> | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json();
    logBody = body as Record<string, unknown>;

    const category = body.category ?? body.formCategory;
    const userId = body.userId ?? body.clientId;
    const formResponseId = body.formResponseId ?? null;
    const formOwnerId = body.formOwnerId ?? null;

    if (category !== "anamnese-treino") {
      return new Response(
        JSON.stringify({ error: "Esta função aceita apenas formulários de treino." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!userId || !formResponseId) {
      return new Response(
        JSON.stringify({ error: "userId e formResponseId são obrigatórios." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: freePlanSubscription } = await supabaseClient
      .from("client_subscriptions")
      .select("id, service_type, responses_used, subscription_plans!inner(name)")
      .eq("user_id", userId)
      .eq("status", "ativo")
      .eq("subscription_plans.name", FREE_PLAN_NAME)
      .in("service_type", ["treino", "treino-dieta"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (freePlanSubscription) {
      const { count: existingTrainingPrescriptionsCount, error: freePlanCountError } = await supabaseClient
        .from("training_prescriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if (freePlanCountError) {
        throw freePlanCountError;
      }

      if ((existingTrainingPrescriptionsCount ?? 0) >= 1) {
        return new Response(
          JSON.stringify({
            error: "O plano Free permite gerar apenas 1 treino. Faça upgrade para criar uma nova prescrição.",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const { data: existingPrescription } = await supabaseClient
      .from("training_prescriptions")
      .select("*")
      .eq("form_response_id", formResponseId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPrescription) {
      if (
        existingPrescription.generation_status === "pending" ||
        existingPrescription.generation_status === "failed"
      ) {
        const workerResult = await runTrainingGenerateWorker(
          supabaseUrl,
          serviceRoleKey,
          existingPrescription.id,
        );

        return new Response(
          JSON.stringify({
            prescriptionId: existingPrescription.id,
            generation_status: workerResult?.generation_status ?? "processing",
            plan_name: existingPrescription.plan_name,
            reused: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      await recordAIAgentExecutionLog(supabaseClient, {
        agentKey: String(existingPrescription.generation_payload?.trainingAgentKey ?? "training_generation"),
        agentLabel: String(existingPrescription.generation_payload?.trainingAgentLabel ?? "Treino"),
        status: "success",
        sourceFunction: "training-intake-webhook",
        stage: "generation",
        userId,
        prescriptionId: existingPrescription.id,
        formResponseId,
        durationMs: Date.now() - startedAt,
        metadata: {
          reused: true,
          generationStatus: existingPrescription.generation_status,
        },
      });

      return new Response(
        JSON.stringify({
          prescriptionId: existingPrescription.id,
          generation_status: existingPrescription.generation_status,
          plan_name: existingPrescription.plan_name,
          reused: true,
        }),
        {
          status: 202,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const [{ data: clientProfile }, { data: metabolicAssessment }, { data: ownerProfile }] =
      await Promise.all([
        supabaseClient
          .from("profiles")
          .select("id, first_name, last_name, whatsapp, email")
          .eq("id", userId)
          .maybeSingle(),
        supabaseClient
          .from("metabolic_assessments")
          .select("age, weight, tmb, get_value, activity_factor, biological_sex, waist_circumference, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        formOwnerId
          ? supabaseClient
              .from("profiles")
              .select("id, ai_config, first_name, last_name")
              .eq("id", formOwnerId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

    if (!metabolicAssessment?.created_at) {
      return new Response(
        JSON.stringify({
          error: "Avaliação metabólica não encontrada. Atualize sua avaliação antes de gerar uma nova prescrição.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const metabolicAssessmentAgeInDays = Math.floor(
      (Date.now() - new Date(metabolicAssessment.created_at).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (metabolicAssessmentAgeInDays > METABOLIC_ASSESSMENT_MAX_AGE_DAYS) {
      return new Response(
        JSON.stringify({
          error: `A última avaliação metabólica tem mais de ${METABOLIC_ASSESSMENT_MAX_AGE_DAYS} dias. Atualize-a antes de gerar uma nova prescrição.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const trainingAgent = resolveTrainingGenerationAgent(body);

    const generationPayload = {
      ...body,
      category,
      clientId: userId,
      userId,
      formResponseId,
      trainingAgentKey: trainingAgent.key,
      trainingAgentLabel: trainingAgent.label,
      aiConfig: ownerProfile?.ai_config ?? body.aiConfig ?? null,
      clientProfile,
      metabolicAssessment,
      generatedAt: new Date().toISOString(),
    };

    const { data: createdPrescription, error: createError } = await supabaseClient.rpc(
      "create_training_prescription",
      {
        p_user_id: userId,
        p_form_response_id: formResponseId,
        p_generation_payload: generationPayload,
      },
    );

    if (createError) {
      throw createError;
    }

    const prescription = Array.isArray(createdPrescription)
      ? createdPrescription[0]
      : createdPrescription;

    if (!prescription?.id) {
      throw new Error("Não foi possível criar a prescrição de treino.");
    }

    if (freePlanSubscription?.id) {
      const { error: updateFreePlanError } = await supabaseClient
        .from("client_subscriptions")
        .update({
          responses_used: (freePlanSubscription.responses_used ?? 0) + 1,
          forms_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", freePlanSubscription.id);

      if (updateFreePlanError) {
        console.error("Erro ao atualizar uso do plano Free de treino:", updateFreePlanError);
      }
    }

    const workerResult = await runTrainingGenerateWorker(
      supabaseUrl,
      serviceRoleKey,
      prescription.id,
    );

    await recordAIAgentExecutionLog(supabaseClient, {
      agentKey: trainingAgent.key,
      agentLabel: trainingAgent.label,
      status: "success",
      sourceFunction: "training-intake-webhook",
      stage: "generation",
      userId,
      prescriptionId: prescription.id,
      formResponseId,
      durationMs: Date.now() - startedAt,
      metadata: {
        reused: false,
        generationStatus: workerResult?.generation_status ?? prescription.generation_status,
      },
    });

    return new Response(
      JSON.stringify({
        prescriptionId: prescription.id,
        generation_status: workerResult?.generation_status ?? prescription.generation_status,
        plan_name: prescription.plan_name,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Erro em training-intake-webhook:", error);

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && serviceRoleKey) {
        const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
        const trainingAgent = logBody ? resolveTrainingGenerationAgent(logBody) : null;

        await recordAIAgentExecutionLog(supabaseClient, {
          agentKey: trainingAgent?.key ?? "training_generation",
          agentLabel: trainingAgent?.label ?? "Treino",
          status: "failed",
          sourceFunction: "training-intake-webhook",
          stage: "generation",
          userId: (logBody?.userId as string | undefined) ?? (logBody?.clientId as string | undefined) ?? null,
          formResponseId: (logBody?.formResponseId as string | undefined) ?? null,
          durationMs: Date.now() - startedAt,
          errorMessage: error instanceof Error ? error.message : "Erro interno ao iniciar a geração do treino.",
          metadata: {
            category: (logBody?.category as string | undefined) ?? (logBody?.formCategory as string | undefined) ?? null,
          },
        });
      }
    } catch (loggingError) {
      console.error("Erro ao registrar log de falha do intake de treino:", loggingError);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno ao iniciar a geração do treino.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
