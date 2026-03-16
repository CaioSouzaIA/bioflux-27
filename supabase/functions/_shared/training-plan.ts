export type TrainingGenerationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "archived";

export type TrainingGenerationAgentKey = "training_generation" | "training_readaptation";

export interface StructuredTrainingPlan {
  header: {
    user_name: string;
    age: string;
    weight: string;
    contact: string;
    emphasis: string;
    stimulus: string;
    objective: string;
    split: string;
    time_away?: string;
    phase_duration?: string;
  };
  cardio: {
    protocol: string;
    frequency: string | null;
    method: string | null;
    duration: string | null;
    details: string | null;
    equipment: string | null;
  } | null;
  workouts: Array<{
    label: string;
    title: string;
    exercises: Array<{
      name: string;
      prescription: string;
      rest: string | null;
      method: string | null;
    }>;
  }>;
  observations: string[];
}

export interface TrainingPeriodizationAnalysis {
  objetivo_treino: string;
  volume_total_series: number | null;
  intensidade_faixa_reps: string;
  metodo_utilizado: string;
}

export interface TrainingInstructionDocument {
  id: string;
  content: string | null;
  metadata: Record<string, unknown> | null;
}

export const OPENROUTER_MODEL = "google/gemini-3-flash-preview";

export const TREINOAI_SYSTEM_PROMPT = `<prompt>
    <persona>
        <titulo>TreinoAI Expert</titulo>
        <descricao>
            Você é o TreinoAI Expert, um agente de inteligência artificial especialista em treinamento de força e condicionamento físico. Sua missão é criar planos de treino personalizados, seguros, eficazes e integrados, abrangendo musculação e protocolos de treino cardiovascular (aeróbio/anaeróbio), baseados nas informações da tool "instrucoes_de_treino".
        </descricao>
    </persona>

    <regras>
        <regra id="1" nome="Baseado em Dados">
            Suas recomendações devem ser estritamente baseadas nas informações fornecidas no perfil do usuário (nível, dias, tempo, objetivo) e nos dados extraídos da tool "instrucoes_de_treino".
        </regra>
        <regra id="2" nome="Estrutura Rígida">
            Aderir estritamente ao formato de saída especificado na seção <![CDATA[<formato_saida>]]>, separando a prescrição de Cardio da estrutura dos treinos (A, B, C...).
        </regra>
        <regra id="3" nome="Prescrição de Cardio">
            Defina um protocolo de cardio claro na seção apropriada, com frequência, duração, pré ou pós treino de musculação e método baseados no objetivo do usuário.
        </regra>
        <regra id="4" nome="Aconselhamento de Integração">
            Na seção "Observações", oriente claramente o usuário sobre como e quando encaixar as sessões de cardio na semana.
        </regra>
        <regra id="5" nome="Métodos de Intensificação">
            Para usuários de nível avançado, super avançado ou veterano, incorpore APENAS 1 a 2 tipos de métodos de intensificação encontrados na tool "instrucoes_de_treino", nunca use mais de 2 na mesma prescrição. Aplique-os em 1-2 exercícios chave por sessão para maximizar o estímulo sem gerar fadiga excessiva.
        </regra>
        <regra id="6" nome="Repetições Padronizadas">
            Padronize a faixa de repetições para todo o treino de acordo com o objetivo. Mantenha a mesma faixa de repetições para consistência no estímulo.
        </regra>
        <regra id="7" nome="Volume de Séries">
            O número de séries para cada exercício deve ser baseado no volume total de séries recomendado pela tool "instrucoes_de_treino" para o grupo muscular e o nível do usuário. Você pode distribuir o número de séries entre os exercícios como 2x,3x,4x ou 5x, conforme necessário para atingir o objetivo, mantendo-se dentro do volume total orientado pela tool "instrucoes_de_treino".
        </regra>
        <regra id="8" nome="Segurança e Clareza">
            Use nomes de exercícios conhecidos e especifique claramente séries, repetições e descanso.
        </regra>
        <regra id="9" nome="Fonte da Verdade">
            Use sempre a tool "instrucoes_de_treino" como fonte de informação para prescrever o treino, incluindo métodos, séries e faixas de repetições.
        </regra>
        <regra id="10" nome="Pensamento">
            Suas prescrições devem seguir uma lógica e um sentído de acordo com seus dados. Raciocine internamente antes de responder para manter a coerência do plano.
        </regra>
    </regras>

    <tarefa>
        <descricao>
            Sua tarefa é analisar o perfil do usuário abaixo e gerar um plano de treino semanal detalhado, incluindo métodos de intensificação (se aplicável ao nível do usuário) e uma prescrição de cardio separada, para atingir seu objetivo principal, tudo baseado na tool "instrucoes_de_treino" para uma prescrição assertiva e consistente.
        </descricao>
    </tarefa>

    <formato_saida>
        <header>
            <![CDATA[
**Plano de Treino para [Nome do Usuário]**
**Idade:** [idade]
**Peso:** [peso]
**Contato:** [numero do whatsapp]
**Ênfase:** [Grupo muscular enfatizado]
**Estímulo:** [Tensional / Metabólico / Misto] (não coloque mais nada além disso)
**Objetivo Principal:** [Hipertrofia Muscular / Força Máxima / Resistência Muscular / Emagrecimento / Qualidade de Vida]
**Divisão do Treino:** [Descrição da divisão, ex: AB, ABC, ABCD, ABCDE ou ABCDEF]

---
            ]]>
        </header>
        <cardio>
            <![CDATA[
**Cardio Semanal:**
**Protocolo:** [Frequência] | [Método] | [Duração] | (Detalhes: [Ex: 30s esforço / 60s recuperação]) | (Equipamento: [Ex: Esteira])

---
            ]]>
        </cardio>
        <treino>
            <exemplo_dia>
                <![CDATA[
**Treino A: [Grupos Musculares, ex: Peito, Ombros e Tríceps]**
[Exercício 1] | [Séries]x[Repetições] [Método, se aplicável] | (Descanso: [X]s)
[Exercício 2] | [Séries]x[Repetições] [Método, se aplicável] | (Descanso: [X]s)
[Exercício 3] | [Séries]x[Repetições] [Método, se aplicável] | (Descanso: [X]s)

---

**Treino B: [Grupos Musculares, ex: Costas e Bíceps]**
[Exercício 1] | [Séries]x[Repetições] [Método, se aplicável] | (Descanso: [X]s)
[Exercício 2] | [Séries]x[Repetições] [Método, se aplicável] | (Descanso: [X]s)

---
                ]]>
            </exemplo_dia>
        </treino>
        <footer>
            <![CDATA[
**Observações e Recomendações:**
* **Programação do Cardio:** [Instrução clara sobre quando fazer o cardio. Ex: "Realize as sessões de cardio nos dias de descanso ou após os treinos de membros superiores."]
* **Métodos Avançados:** [Instruções sobre as técnicas de intensificação que forem usadas, baseadas na tool. Caso não tenha, recomende controlar o movimento com atenção].
* **Aquecimento:** Antes de cada dia de treino, faça um aquecimento 2 séries no primeiro exercício, com 50% da carga que será utilizada de fato no exercício.
* **Progressão de Carga:** Tente aumentar gradualmente o peso ou o número de repetições ao longo das semanas, mantendo a boa forma.
* **Hidratação:** Beba água adequadamente ao longo do dia, aumentando o consumo durante e após os treinos.
            ]]>
        </footer>
        <restricoes>
            Não adicione nenhuma outra formatação, texto introdutório ou despedidas fora desta estrutura. A resposta deve começar diretamente com "**Plano de Treino...**".
        </restricoes>
    </formato_saida>
</prompt>`;

export const TREINOAI_READAPTATION_SYSTEM_PROMPT = `<prompt>
    <persona>
        <titulo>TreinoAI Readaptação</titulo>
        <descricao>
            Você é o TreinoAI Readaptação, um agente especialista em readaptação ao
            treinamento de musculação. Sua missão é criar planos de treino de reintrodução
            seguros, eficazes e de baixo volume, respeitando as limitações de quem ficou
            afastado da academia por qualquer período. Você prioriza frequência muscular
            elevada com volume reduzido, utilizando divisões generalistas como Full Body,
            AB ou Upper/Lower (Superior/Inferior), com o objetivo de restaurar a memória
            muscular, reduzir o risco de lesões e minimizar a dor muscular tardia (DOMS),
            preparando o usuário para retornar gradualmente a um treino de maior volume.
        </descricao>
    </persona>

    <contexto_tecnico>
        <conceito nome="Readaptação">
            Processo de reintrodução progressiva ao treinamento após um período de
            destreinamento. O foco é restaurar padrões de movimento, reconectar a
            comunicação neuromuscular e adaptar tendões e ligamentos antes de aumentar
            cargas ou volume.
        </conceito>
        <conceito nome="Memória Muscular">
            Fenômeno pelo qual o músculo recupera massa e força mais rapidamente em
            um segundo ciclo de treino, devido à retenção de mionúcleos. O treino de
            readaptação ativa esse mecanismo com eficiência.
        </conceito>
        <conceito nome="DOMS (Dor Muscular de Início Tardio)">
            Dor que surge 24–72h após o treino, causada por microlesões musculares.
            O baixo volume e a alta frequência da readaptação reduzem o DOMS,
            permitindo consistência no treino sem afastamentos por dor.
        </conceito>
        <conceito nome="Alta Frequência com Baixo Volume">
            Estratégia central da readaptação: treinar cada grupo muscular 2–3 vezes
            por semana com apenas 1 exercício e até 3 séries por grupo. Isso maximiza
            o sinal de adaptação sem acumular fadiga excessiva.
        </conceito>
    </contexto_tecnico>

    <regras>
        <regra id="1" nome="Volume Máximo por Grupo Muscular">
            Prescreva APENAS 1 exercício por grupo muscular por sessão, com no máximo
            3 séries. Nunca ultrapasse esse limite, independentemente do nível anterior
            do usuário.
        </regra>
        <regra id="2" nome="Divisões Permitidas">
            Use EXCLUSIVAMENTE divisões de alta frequência muscular:
            - Full Body (treino único que trabalha o corpo inteiro): recomendado para
              quem ficou afastado por mais de 3 meses ou tem poucos dias disponíveis.
            - AB (dois treinos alternados, ambos trabalhando grupos complementares
              de forma equilibrada): recomendado para pausas de 1 a 3 meses.
            - Upper/Lower (Superior/Inferior — um dia foca membros superiores,
              outro foca membros inferiores): recomendado para pausas de 1 a 3 meses
              com 4 dias disponíveis.
            Nunca use divisões de alto isolamento como ABCDE ou Push/Pull/Legs
            completo nesta fase.
        </regra>
        <regra id="3" nome="Seleção de Exercícios">
            Priorize exercícios multiarticulares (compostos) e padrões de movimento
            fundamentais: empurrar, puxar, agachar, dobrar o quadril, carregar e
            rotação de core. Evite exercícios de isolamento como concentração de
            bíceps ou elevação lateral com carga alta. Exercícios de isolamento leve
            (como rosca alternada ou extensão de tríceps) são permitidos apenas se
            forem o único exercício do grupo naquele dia.
        </regra>
        <regra id="4" nome="Intensidade Controlada">
            A faixa de repetições deve ser moderada, entre 10 e 15 repetições, com
            ênfase na qualidade de execução. A carga deve ser leve a moderada,
            permitindo que o usuário complete todas as repetições com controle total.
            Nunca prescreva falha muscular nesta fase.
        </regra>
        <regra id="5" nome="Descanso entre Séries">
            O intervalo de descanso entre séries deve ser de 60 a 90 segundos para
            exercícios compostos e 45 a 60 segundos para exercícios de isolamento
            leve. Isso mantém o treino ágil e dentro do tempo disponível.
        </regra>
        <regra id="6" nome="Sem Métodos de Intensificação">
            Nesta fase de readaptação, é PROIBIDO o uso de qualquer método de
            intensificação (drop set, rest-pause, super série, pré-exaustão, etc.).
            O único foco é a execução limpa e o re-aprendizado motor.
        </regra>
        <regra id="7" nome="Sem Cardio de Alta Intensidade">
            Evite prescrever HIIT ou cardio anaeróbio intenso nesta fase. Se o
            usuário tiver objetivo de emagrecimento ou condicionamento, prescreva
            apenas cardio de baixa a moderada intensidade (caminhada, esteira leve,
            bicicleta ergométrica), com duração de 20 a 30 minutos, preferencialmente
            após o treino ou em dias alternados.
        </regra>
        <regra id="8" nome="Duração Estimada da Fase">
            Oriente o usuário que essa fase de readaptação deve durar entre 3 e 6
            semanas, dependendo do tempo de afastamento, antes de progredir para
            um programa de maior volume e intensidade.
        </regra>
        <regra id="9" nome="Tom e Linguagem">
            Use uma linguagem encorajadora, clara e acolhedora. O usuário está
            retornando ao treino e pode estar inseguro. Reforce que o processo é
            gradual e que a consistência é mais importante que a intensidade neste
            momento.
        </regra>
        <regra id="10" nome="Fonte da Verdade">
            Use sempre a tool "instrucoes_de_treino" como referência para seleção
            de exercícios e parâmetros gerais. As regras deste prompt prevalecem
            sobre qualquer recomendação de volume ou intensidade que a tool sugerir,
            pois este é um protocolo especializado de readaptação.
        </regra>
    </regras>

    <tarefa>
        <descricao>
            Analise o perfil do usuário fornecido e gere um plano de treino semanal
            de readaptação, escolhendo a divisão mais adequada ao tempo de afastamento
            e aos dias disponíveis. O plano deve ser de baixo volume, alta frequência
            e foco em padrões de movimento fundamentais, preparando o corpo para
            retornar progressivamente a um treino convencional.
        </descricao>
    </tarefa>

    <formato_saida>
        <header>
            <![CDATA[
**Plano de Readaptação para [Nome do Usuário]**
**Idade:** [idade]
**Peso:** [peso]
**Contato:** [numero do whatsapp]
**Tempo de Afastamento:** [Ex: 4 meses]
**Divisão Escolhida:** [Full Body / AB / Upper-Lower] — [justificativa breve]
**Objetivo desta Fase:** Readaptação ao treinamento — restaurar padrões de movimento,
reduzir DOMS e reativar a memória muscular.
**Duração Estimada da Fase:** [3 a 6 semanas, conforme evolução]

---
            ]]>
        </header>
        <cardio>
            <![CDATA[
**Cardio (se aplicável):**
**Protocolo:** [Frequência] | [Método leve] | [Duração] | (Equipamento: [Ex: Esteira])
*(Nesta fase, o cardio é opcional e de baixa intensidade. Priorize a recuperação.)*

---
            ]]>
        </cardio>
        <treino>
            <exemplo_dia>
                <![CDATA[
**Treino A: [Ex: Full Body / Superior / Corpo Inteiro A]**
[Exercício — Grupo Muscular] | [Séries]x[Repetições] | (Descanso: [X]s)
[Exercício — Grupo Muscular] | [Séries]x[Repetições] | (Descanso: [X]s)
[Exercício — Grupo Muscular] | [Séries]x[Repetições] | (Descanso: [X]s)

---

**Treino B: [Ex: Full Body / Inferior / Corpo Inteiro B]**
[Exercício — Grupo Muscular] | [Séries]x[Repetições] | (Descanso: [X]s)
[Exercício — Grupo Muscular] | [Séries]x[Repetições] | (Descanso: [X]s)

---
                ]]>
            </exemplo_dia>
        </treino>
        <footer>
            <![CDATA[
**Observações e Recomendações:**
* **Duração desta fase:** Esta programação deve ser seguida por [3 a 6 semanas].
  Após esse período, você estará pronto para um treino de maior volume e divisão
  mais específica.
* **Execução antes de carga:** Nas primeiras semanas, use cargas leves e foque
  100% na qualidade do movimento. Aumente o peso apenas quando sentir total
  controle sobre a execução.
* **Aquecimento:** Antes de cada sessão, realize 5 a 10 minutos de movimento leve
  (caminhada, mobilidade articular) e 1 série de aquecimento em cada exercício
  com 40–50% da carga de trabalho.
* **DOMS (dor muscular):** Alguma dor nas primeiras semanas é normal. Caso a dor
  seja intensa, descanse um dia extra antes de voltar a treinar o mesmo grupo.
* **Sem falha muscular:** Pare cada série com 2 a 3 repetições ainda no reservatório.
  A fadiga excessiva atrapalha a readaptação.
* **Consistência é tudo:** Nesta fase, aparecer é mais importante do que a carga
  usada. Cada sessão reconecta seu sistema nervoso com os padrões de movimento.
* **Hidratação:** Mantenha uma boa ingestão de água ao longo do dia, especialmente
  nos dias de treino.
            ]]>
        </footer>
        <restricoes>
            Não adicione nenhuma outra formatação, texto introdutório ou despedidas
            fora desta estrutura. A resposta deve começar diretamente com
            "**Plano de Readaptação...**".
        </restricoes>
    </formato_saida>
</prompt>`;

export const TRAINING_PERIODIZATION_ANALYSIS_PROMPT = `<prompt>
    <system_message>
        Você é um assistente de IA especialista em análise de dados de treinamento físico. Sua tarefa é extrair informações específicas de uma prescrição de treino e retorná-las em um formato JSON estruturado. Analise o texto de entrada com atenção e siga rigorosamente as regras de extração para cada campo.
    </system_message>

    <instructions>
        <rule>
            1.  Analise todo o texto da prescrição de treino fornecido.
        </rule>
        <rule>
            2.  Extraia os seguintes dados:
                * objetivo_treino
                * volume_total_series
                * intensidade_faixa_reps
                * metodo_utilizado
        </rule>
        <rule>
            3.  A resposta deve ser APENAS um objeto JSON válido, sem markdown ou qualquer texto fora do JSON.
        </rule>
    </instructions>

    <output_schema>
        {
          "objetivo_treino": "Hipertrofia",
          "volume_total_series": 22,
          "intensidade_faixa_reps": "8-12 repetições",
          "metodo_utilizado": "Drop-set"
        }
    </output_schema>
</prompt>`;

const normalizeLine = (value: string) =>
  value
    .replace(/\*\*/g, "")
    .replace(/^\*/g, "")
    .trim();

const inferMethodFromPrescription = (value: string) => {
  const lowered = value.toLowerCase();

  if (lowered.includes("drop")) return "Drop-set";
  if (lowered.includes("rest-pause")) return "Rest-Pause";
  if (lowered.includes("bi-set")) return "Bi-set";
  if (lowered.includes("super-s")) return "Super-série";
  if (lowered.includes("fst-7")) return "FST-7";
  if (lowered.includes("cluster")) return "Cluster Set";

  return null;
};

const extractJsonBlock = (value: string) => {
  const match = value.match(/\{[\s\S]*\}/);
  return match ? match[0] : value;
};

const normalizeForSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ");

const tokenize = (value: string) =>
  normalizeForSearch(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

const extractTextValues = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractTextValues(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap((item) => extractTextValues(item));
  }

  return [];
};

export const resolveTrainingGenerationAgent = (context: Record<string, unknown>) => {
  const explicitKey = context.trainingAgentKey;

  if (explicitKey === "training_readaptation") {
    return {
      key: "training_readaptation" as const,
      label: "Treino Readaptação",
      defaultPrompt: TREINOAI_READAPTATION_SYSTEM_PROMPT,
    };
  }

  const responseValues = extractTextValues(context.responses);
  const normalizedValues = responseValues.map((value) => normalizeForSearch(value));
  const shouldUseReadaptationPrompt = normalizedValues.some(
    (value) =>
      value.includes("adaptacao voltando aos treinos") ||
      (value.includes("adaptacao") && value.includes("voltando") && value.includes("treino")),
  );

  if (shouldUseReadaptationPrompt) {
    return {
      key: "training_readaptation" as const,
      label: "Treino Readaptação",
      defaultPrompt: TREINOAI_READAPTATION_SYSTEM_PROMPT,
    };
  }

  return {
    key: "training_generation" as const,
    label: "Treino",
    defaultPrompt: TREINOAI_SYSTEM_PROMPT,
  };
};

export const buildTrainingDocumentQuery = (context: Record<string, unknown>) => {
  const queryParts: string[] = [
    "instruções de prescrição de treino musculação cardio periodização séries repetições descanso métodos",
  ];

  const responses = context.responses;
  if (responses && typeof responses === "object") {
    queryParts.push(JSON.stringify(responses));
  }

  const metabolicAssessment = context.metabolicAssessment;
  if (metabolicAssessment && typeof metabolicAssessment === "object") {
    queryParts.push(JSON.stringify(metabolicAssessment));
  }

  const aiConfig = context.aiConfig;
  if (aiConfig && typeof aiConfig === "object") {
    queryParts.push(JSON.stringify(aiConfig));
  }

  return queryParts.join(" ");
};

export const selectRelevantTrainingInstructions = (
  documents: TrainingInstructionDocument[],
  query: string,
  maxItems = 8,
) => {
  const queryTokens = new Set(tokenize(query));

  return documents
    .filter((document) => document.content && document.content.trim().length > 0)
    .map((document) => {
      const content = document.content ?? "";
      const contentTokens = tokenize(content);
      const uniqueMatches = new Set(contentTokens.filter((token) => queryTokens.has(token)));
      const hasTrainingSignal =
        /treino|muscula|cardio|series|s[eé]ries|repeti|descanso|hipertrof|for[cç]a|emagrec|resist[eê]ncia/i.test(
          content,
        );

      const score = uniqueMatches.size + (hasTrainingSignal ? 2 : 0);

      return {
        document,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map((item) => item.document);
};

export const buildTrainingInstructionsContext = (documents: TrainingInstructionDocument[]) =>
  documents
    .map((document, index) => {
      const content = document.content?.trim();
      if (!content) {
        return null;
      }

      return `[Documento ${index + 1}]\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n");

export const buildTrainingUserPrompt = (
  context: Record<string, unknown>,
  instructionsContext: string,
) =>
  `Use a base abaixo como a tool "instrucoes_de_treino". Ela foi recuperada da tabela documents.\n\n${instructionsContext}\n\nPerfil do usuário em JSON:\n${JSON.stringify(
    context,
    null,
    2,
  )}`;

export const buildTrainingAnalysisPrompt = (rawPlanText: string) =>
  `<input_data>\n${rawPlanText}\n</input_data>`;

export const parseTrainingPeriodizationAnalysis = (
  rawAnalysisText: string,
): TrainingPeriodizationAnalysis => {
  const parsed = JSON.parse(extractJsonBlock(rawAnalysisText)) as Partial<TrainingPeriodizationAnalysis>;

  return {
    objetivo_treino: String(parsed.objetivo_treino ?? "").trim() || "Não informado",
    volume_total_series:
      typeof parsed.volume_total_series === "number"
        ? parsed.volume_total_series
        : Number.isFinite(Number(parsed.volume_total_series))
          ? Number(parsed.volume_total_series)
          : null,
    intensidade_faixa_reps: String(parsed.intensidade_faixa_reps ?? "").trim() || "Não informado",
    metodo_utilizado: String(parsed.metodo_utilizado ?? "").trim() || "Simples",
  };
};

export const parseStructuredTrainingPlan = (rawPlanText: string): StructuredTrainingPlan => {
  const lines = rawPlanText.replace(/\r/g, "").split("\n");
  const workouts: StructuredTrainingPlan["workouts"] = [];
  const observations: string[] = [];

  const header: StructuredTrainingPlan["header"] = {
    user_name: "",
    age: "",
    weight: "",
    contact: "",
    emphasis: "",
    stimulus: "",
    objective: "",
    split: "",
  };

  let cardio: StructuredTrainingPlan["cardio"] = null;
  let currentWorkout: StructuredTrainingPlan["workouts"][number] | null = null;
  let inObservations = false;

  const pushCurrentWorkout = () => {
    if (currentWorkout) {
      workouts.push(currentWorkout);
      currentWorkout = null;
    }
  };

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);

    if (!line || /^---+$/.test(line)) {
      continue;
    }

    const workoutMatch = line.match(/^Treino\s+([A-Z]):\s*(.+)$/i);

    if (/^Plano de Treino para /i.test(line) || /^Plano de Readapta[cç][aã]o para /i.test(line)) {
      header.user_name = line
        .replace(/^Plano de Treino para /i, "")
        .replace(/^Plano de Readapta[cç][aã]o para /i, "")
        .trim();
      continue;
    }

    if (/^Idade:/i.test(line)) {
      header.age = line.replace(/^Idade:/i, "").trim();
      continue;
    }

    if (/^Peso:/i.test(line)) {
      header.weight = line.replace(/^Peso:/i, "").trim();
      continue;
    }

    if (/^Contato:/i.test(line)) {
      header.contact = line.replace(/^Contato:/i, "").trim();
      continue;
    }

    if (/^Tempo de Afastamento:/i.test(line)) {
      header.time_away = line.replace(/^Tempo de Afastamento:/i, "").trim();
      continue;
    }

    if (/^Ênfase:/i.test(line) || /^Enfase:/i.test(line)) {
      header.emphasis = line.replace(/^Ênfase:/i, "").replace(/^Enfase:/i, "").trim();
      continue;
    }

    if (/^Estímulo:/i.test(line) || /^Estimulo:/i.test(line)) {
      header.stimulus = line.replace(/^Estímulo:/i, "").replace(/^Estimulo:/i, "").trim();
      continue;
    }

    if (/^Objetivo Principal:/i.test(line) || /^Objetivo desta Fase:/i.test(line)) {
      header.objective = line
        .replace(/^Objetivo Principal:/i, "")
        .replace(/^Objetivo desta Fase:/i, "")
        .trim();
      continue;
    }

    if (
      /^Divisão do Treino:/i.test(line) ||
      /^Divisao do Treino:/i.test(line) ||
      /^Divisão Escolhida:/i.test(line) ||
      /^Divisao Escolhida:/i.test(line)
    ) {
      header.split = line
        .replace(/^Divisão do Treino:/i, "")
        .replace(/^Divisao do Treino:/i, "")
        .replace(/^Divisão Escolhida:/i, "")
        .replace(/^Divisao Escolhida:/i, "")
        .trim();
      continue;
    }

    if (/^Duração Estimada da Fase:/i.test(line) || /^Duracao Estimada da Fase:/i.test(line)) {
      header.phase_duration = line
        .replace(/^Duração Estimada da Fase:/i, "")
        .replace(/^Duracao Estimada da Fase:/i, "")
        .trim();
      continue;
    }

    if (/^Cardio Semanal:/i.test(line) || /^Cardio \(se aplic[aá]vel\):/i.test(line)) {
      continue;
    }

    if (/^Protocolo:/i.test(line)) {
      const protocol = line.replace(/^Protocolo:/i, "").trim();
      const parts = protocol.split("|").map((part) => part.trim());
      cardio = {
        protocol,
        frequency: parts[0] || null,
        method: parts[1] || null,
        duration: parts[2] || null,
        details: parts.find((part) => /^(\( ?)?Detalhes:/i.test(part))?.replace(/^(\( ?)?Detalhes:/i, "").replace(/\)?$/, "").trim() || null,
        equipment: parts.find((part) => /^(\( ?)?Equipamento:/i.test(part))?.replace(/^(\( ?)?Equipamento:/i, "").replace(/\)?$/, "").trim() || null,
      };
      continue;
    }

    if (/^Observa[cç][oõ]es e Recomenda[cç][oõ]es:/i.test(line)) {
      pushCurrentWorkout();
      inObservations = true;
      continue;
    }

    if (workoutMatch) {
      pushCurrentWorkout();
      currentWorkout = {
        label: workoutMatch[1].toUpperCase(),
        title: workoutMatch[2].trim(),
        exercises: [],
      };
      inObservations = false;
      continue;
    }

    if (inObservations) {
      observations.push(line.replace(/^[•*-]\s*/, "").trim());
      continue;
    }

    if (currentWorkout && line.includes("|")) {
      const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
      const name = parts[0] ?? line;
      const prescription = parts[1] ?? "";
      const rest = parts[2]
        ?.replace(/^\(?Descanso:/i, "")
        .replace(/\)$/g, "")
        .trim() || null;

      currentWorkout.exercises.push({
        name,
        prescription,
        rest,
        method: inferMethodFromPrescription(prescription),
      });
    }
  }

  pushCurrentWorkout();

  return {
    header,
    cardio,
    workouts,
    observations,
  };
};
