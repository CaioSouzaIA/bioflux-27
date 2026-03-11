export const loadActivePrompt = async (
  supabaseClient: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: unknown) => {
          order: (
            column: string,
            options?: { ascending?: boolean },
          ) => {
            limit: (count: number) => Promise<{
              data: Array<{ prompt_content: string | null }> | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  },
  agentKey: string,
  fallbackPrompt: string,
) => {
  const { data, error } = await supabaseClient
    .from("ai_agent_prompt_versions")
    .select("prompt_content")
    .eq("agent_key", agentKey)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error(`Erro ao carregar prompt ativo de ${agentKey}:`, error.message);
    return fallbackPrompt;
  }

  const prompt = data?.[0]?.prompt_content?.trim();
  return prompt || fallbackPrompt;
};

