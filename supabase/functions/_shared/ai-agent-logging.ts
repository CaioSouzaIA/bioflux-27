export type AIAgentExecutionLogPayload = {
  agentKey: string;
  agentLabel: string;
  status: "success" | "failed";
  sourceFunction: string;
  stage: string;
  userId?: string | null;
  prescriptionId?: string | null;
  formResponseId?: string | null;
  modelSlug?: string | null;
  durationMs?: number | null;
  promptCommitName?: string | null;
  secondaryPromptCommitName?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
  requestPayload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
};

type MinimalSupabaseClient = {
  from: (table: string) => {
    insert: (value: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

export const recordAIAgentExecutionLog = async (
  supabaseClient: MinimalSupabaseClient,
  payload: AIAgentExecutionLogPayload,
) => {
  const { error } = await supabaseClient.from("ai_agent_execution_logs").insert({
    agent_key: payload.agentKey,
    agent_label: payload.agentLabel,
    status: payload.status,
    source_function: payload.sourceFunction,
    stage: payload.stage,
    user_id: payload.userId ?? null,
    prescription_id: payload.prescriptionId ?? null,
    form_response_id: payload.formResponseId ?? null,
    model_slug: payload.modelSlug ?? null,
    duration_ms: payload.durationMs ?? null,
    prompt_commit_name: payload.promptCommitName ?? null,
    secondary_prompt_commit_name: payload.secondaryPromptCommitName ?? null,
    error_message: payload.errorMessage ?? null,
    metadata: payload.metadata ?? null,
    request_payload: payload.requestPayload ?? null,
    response_payload: payload.responsePayload ?? null,
  });

  if (error) {
    console.error("Erro ao registrar log de execucao do agente:", error.message);
  }
};
