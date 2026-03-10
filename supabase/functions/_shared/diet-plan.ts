export type DietGenerationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "archived";

export interface StructuredDietPlan {
  header: {
    user_name: string;
    age: string;
    weight: string;
    contact: string;
    objective: string;
    estimated_calories_kcal: number | null;
    macros: {
      proteins_g: number | null;
      carbs_g: number | null;
      fats_g: number | null;
    };
  };
  meals: Array<{
    meal_number: number;
    title: string;
    items: Array<{
      name: string;
      preparation: string | null;
      quantity: string;
      substitutions: Array<{
        name: string;
        quantity: string;
      }>;
    }>;
  }>;
  observations: {
    hydration: string | null;
    extra_notes: string[];
  };
}

export const OPENROUTER_MODEL = "google/gemini-3-flash-preview";

export const NUTRIAI_SYSTEM_PROMPT = `# Persona e Diretrizes

Você é o **NutriAI Expert**, um agente de inteligência artificial especializado em nutrição esportiva. Sua missão é criar planos alimentares personalizados, seguros, eficazes e altamente flexíveis, baseados nos dados fornecidos pelo usuário.

**Diretrizes Gerais:**
1.  **Baseado em Dados:** Suas recomendações devem ser estritamente baseadas nas informações fornecidas no perfil do usuário. Não invente dados.
2.  **Clareza e Simplicidade:** Use nomes de alimentos comuns e medidas caseiras. Inclua o método de preparo (ex: grelhado, cozido) e a quantidade em gramas ou unidades.
3.  **Foco no Formato:** Aderir estritamente ao formato de saída solicitado é crucial.
4.  **Flexibilidade por Alimento:** O plano deve ser sustentável. Oferecer substituições equivalentes para cada item da refeição é fundamental para a adesão do usuário.

---

# Tarefa Principal

Sua tarefa é analisar o perfil do usuário abaixo e gerar um plano alimentar diário detalhado, refeição por refeição, para atingir seu objetivo principal.

Para cada refeição, você **DEVE** primeiro listar os alimentos que a compõem. Em seguida, para cada alimento listado (sempre que aplicável), você deve fornecer uma linha dedicada com opções de substituição equivalentes, incluindo o nome do alimento, o modo de preparo e a quantidade exata para a troca.

Siga o formato de substituição exemplificado: \`[Substituto 1] - [Quantidade] - ou - [Substituto 2] - [Quantidade]\`.

Caso o usuário já tenha hábitos alimentares, procure planejar algo próximo do que ele já faz no dia a dia.

---

# Formato Obrigatório da Saída

Use **SEMPRE** o seguinte formato para a resposta. Não adicione nenhuma outra formatação, texto introdutório ou despedidas fora desta estrutura.

**Plano Alimentar para [Nome do Usuário]**
**Idade:** [idade]
**Peso:** [peso]
**Contato:** [numero do whatsapp]

**Objetivo:** [Objetivo Principal do Usuário]
**Calorias Totais Estimadas:** [Calcular e Inserir Valor] Kcal
**Macronutrientes Estimados:** Proteínas: [X]g / Carboidratos: [Y]g / Gorduras: [Z]g

---

**Refeição 1: [Nome da Refeição, ex: Café da Manhã]**
[Alimento 1] ([Preparo Sugerido]) [Quantidade 1]
[Alimento 2] ([Preparo Sugerido]) [Quantidade 2]
[Alimento 3] ([Preparo Sugerido]) [Quantidade 3]
...

• **Opções de substituição para [Alimento 1]:**
[Substituto 1.1] - [Quantidade Equivalente] - ou - [Substituto 1.2] - [Quantidade Equivalente]

• **Opções de substituição para [Alimento 2]:**
[Substituto 2.1] - [Quantidade Equivalente] - ou - [Substituto 2.2] - [Quantidade Equivalente] - ou - [Substituto 2.3] - [Quantidade Equivalente]

*(Continue o padrão de substituição para cada alimento da refeição que permita trocas. Alimentos como "Salada à vontade" podem não necessitar de uma linha de substituição dedicada).*

---

**Refeição 2: [Nome da Refeição, ex: Almoço]**
[Alimento 1] ([Preparo Sugerido]) [Quantidade 1]
[Alimento 2] ([Preparo Sugerido]) [Quantidade 2]
[Alimento 3] ([Preparo Sugerido]) [Quantidade 3]
...

• **Opções de substituição para [Alimento 1]:**
[Substituto 1.1] - [Quantidade Equivalente] - ou - [Substituto 1.2] - [Quantidade Equivalente]

• **Opções de substituição para [Alimento 2]:**
[Substituto 2.1] - [Quantidade Equivalente] - ou - [Substituto 2.2] - [Quantidade Equivalente]

*(Continue o padrão para todas as refeições necessárias).*

---

**Observações e Recomendações:**
* **Hidratação:** Beba no mínimo [X] litros de água ao longo do dia.`;

const normalizeLine = (value: string) =>
  value
    .replace(/\*\*/g, "")
    .replace(/^\*/g, "")
    .trim();

const normalizeKey = (value: string) =>
  normalizeLine(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const extractNumber = (value: string): number | null => {
  const match = value.replace(/\./g, "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const parseMealItem = (line: string) => {
  const match = line.match(/^(.*?)(?:\s+\((.*?)\))?\s+(.+)$/);
  if (!match) {
    return {
      name: line.trim(),
      preparation: null,
      quantity: "",
      substitutions: [],
    };
  }

  return {
    name: match[1].trim(),
    preparation: match[2]?.trim() || null,
    quantity: match[3].trim(),
    substitutions: [],
  };
};

const parseSubstitutions = (line: string) => {
  return line
    .split(/\s*-\s*ou\s*-\s*/i)
    .map((option) => option.trim())
    .filter(Boolean)
    .map((option) => {
      const match = option.match(/^(.*?)\s*-\s*(.+)$/);
      if (!match) {
        return {
          name: option,
          quantity: "",
        };
      }

      return {
        name: match[1].trim(),
        quantity: match[2].trim(),
      };
    });
};

export const buildDietUserPrompt = (context: Record<string, unknown>) =>
  `Analise o perfil abaixo e gere o plano alimentar solicitado, respeitando exatamente o formato obrigatório.\n\nPerfil do usuário em JSON:\n${JSON.stringify(
    context,
    null,
    2,
  )}`;

export const parseStructuredDietPlan = (rawPlanText: string): StructuredDietPlan => {
  const lines = rawPlanText.replace(/\r/g, "").split("\n");
  const meals: StructuredDietPlan["meals"] = [];
  const extraNotes: string[] = [];

  const header: StructuredDietPlan["header"] = {
    user_name: "",
    age: "",
    weight: "",
    contact: "",
    objective: "",
    estimated_calories_kcal: null,
    macros: {
      proteins_g: null,
      carbs_g: null,
      fats_g: null,
    },
  };

  let currentMeal: StructuredDietPlan["meals"][number] | null = null;
  let currentSubstitutionTarget: string | null = null;
  let inObservations = false;
  let mealCounter = 0;

  const pushCurrentMeal = () => {
    if (currentMeal) {
      meals.push(currentMeal);
      currentMeal = null;
    }
  };

  const attachSubstitutions = (targetName: string, line: string) => {
    if (!currentMeal) {
      return;
    }

    const normalizedTarget = normalizeKey(targetName);
    const targetItem =
      currentMeal.items.find((item) => normalizeKey(item.name) === normalizedTarget) ||
      currentMeal.items.find((item) => normalizeKey(item.name).includes(normalizedTarget)) ||
      currentMeal.items.find((item) => normalizedTarget.includes(normalizeKey(item.name)));

    if (!targetItem) {
      return;
    }

    targetItem.substitutions = parseSubstitutions(line);
  };

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);

    if (!line || /^---+$/.test(line)) {
      continue;
    }

    const mealMatch = line.match(/^Refei[cç][aã]o\s+(\d+):\s*(.+)$/i);
    const substitutionsMatch = line.match(/^•\s*Op[cç][oõ]es de substitui[cç][aã]o para\s+(.+):$/i);

    if (/^Plano Alimentar para /i.test(line)) {
      header.user_name = line.replace(/^Plano Alimentar para /i, "").trim();
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

    if (/^Objetivo:/i.test(line)) {
      header.objective = line.replace(/^Objetivo:/i, "").trim();
      continue;
    }

    if (/^Calorias Totais Estimadas:/i.test(line)) {
      header.estimated_calories_kcal = extractNumber(line);
      continue;
    }

    if (/^Macronutrientes Estimados:/i.test(line)) {
      const proteins = line.match(/Prote[ií]nas:\s*([\d.,]+)/i);
      const carbs = line.match(/Carboidratos:\s*([\d.,]+)/i);
      const fats = line.match(/Gorduras:\s*([\d.,]+)/i);

      header.macros = {
        proteins_g: proteins ? extractNumber(proteins[1]) : null,
        carbs_g: carbs ? extractNumber(carbs[1]) : null,
        fats_g: fats ? extractNumber(fats[1]) : null,
      };
      continue;
    }

    if (/^Observa[cç][oõ]es e Recomenda[cç][oõ]es:/i.test(line)) {
      pushCurrentMeal();
      inObservations = true;
      currentSubstitutionTarget = null;
      continue;
    }

    if (mealMatch) {
      pushCurrentMeal();
      currentMeal = {
        meal_number: Number(mealMatch[1]) || mealCounter + 1,
        title: mealMatch[2].trim(),
        items: [],
      };
      mealCounter = currentMeal.meal_number;
      currentSubstitutionTarget = null;
      inObservations = false;
      continue;
    }

    if (substitutionsMatch) {
      currentSubstitutionTarget = substitutionsMatch[1].trim();
      continue;
    }

    if (currentSubstitutionTarget) {
      attachSubstitutions(currentSubstitutionTarget, line);
      currentSubstitutionTarget = null;
      continue;
    }

    if (inObservations) {
      if (/^Hidrata[cç][aã]o:/i.test(line)) {
        const hydrationValue = line.replace(/^Hidrata[cç][aã]o:/i, "").trim();
        extraNotes.push(`Hidratação: ${hydrationValue}`);
      } else {
        extraNotes.push(line);
      }
      continue;
    }

    if (currentMeal) {
      currentMeal.items.push(parseMealItem(line));
    }
  }

  pushCurrentMeal();

  const hydrationLine = extraNotes.find((note) => /^Hidratação:/i.test(note));
  const hydration = hydrationLine ? hydrationLine.replace(/^Hidratação:/i, "").trim() : null;
  const filteredNotes = extraNotes.filter((note) => !/^Hidratação:/i.test(note));

  if (!header.user_name || meals.length === 0) {
    throw new Error("A resposta do modelo não seguiu o formato obrigatório do plano alimentar.");
  }

  return {
    header,
    meals,
    observations: {
      hydration,
      extra_notes: filteredNotes,
    },
  };
};
