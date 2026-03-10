export type TrainingGenerationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "archived";

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

    if (/^Plano de Treino para /i.test(line)) {
      header.user_name = line.replace(/^Plano de Treino para /i, "").trim();
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

    if (/^Ênfase:/i.test(line) || /^Enfase:/i.test(line)) {
      header.emphasis = line.replace(/^Ênfase:/i, "").replace(/^Enfase:/i, "").trim();
      continue;
    }

    if (/^Estímulo:/i.test(line) || /^Estimulo:/i.test(line)) {
      header.stimulus = line.replace(/^Estímulo:/i, "").replace(/^Estimulo:/i, "").trim();
      continue;
    }

    if (/^Objetivo Principal:/i.test(line)) {
      header.objective = line.replace(/^Objetivo Principal:/i, "").trim();
      continue;
    }

    if (/^Divisão do Treino:/i.test(line) || /^Divisao do Treino:/i.test(line)) {
      header.split = line
        .replace(/^Divisão do Treino:/i, "")
        .replace(/^Divisao do Treino:/i, "")
        .trim();
      continue;
    }

    if (/^Cardio Semanal:/i.test(line)) {
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
