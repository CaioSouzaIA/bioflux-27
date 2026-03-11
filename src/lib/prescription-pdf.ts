import { jsPDF } from 'jspdf';

import type { DietPrescription } from '@/hooks/useDietPrescriptions';
import type { TrainingPrescription } from '@/hooks/useTrainingPrescriptions';

const BRAND_LOGO_PATH = '/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png';
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const sanitizeFileName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

const loadImageAsDataUrl = async (path: string) => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error('Nao foi possivel carregar a logo da Bioflux.');
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Nao foi possivel converter a logo para PDF.'));
    reader.readAsDataURL(blob);
  });
};

const createBasePdf = async (title: string, subtitle: string) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let cursorY = 18;

  doc.setFillColor(7, 7, 9);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  doc.setFillColor(16, 16, 20);
  doc.roundedRect(MARGIN_X, 10, CONTENT_WIDTH, 24, 6, 6, 'F');

  try {
    const logoDataUrl = await loadImageAsDataUrl(BRAND_LOGO_PATH);
    doc.addImage(logoDataUrl, 'PNG', MARGIN_X + 5, 14, 26, 12);
  } catch {
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('BIOFLUX', MARGIN_X + 5, 22);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, MARGIN_X + 34, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 185);
  doc.text(subtitle, MARGIN_X + 34, 26);

  cursorY = 44;

  const ensureSpace = (heightNeeded: number) => {
    if (cursorY + heightNeeded <= PAGE_HEIGHT - 18) {
      return;
    }

    doc.addPage();
    doc.setFillColor(7, 7, 9);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    cursorY = 18;
  };

  const addSectionTitle = (label: string) => {
    ensureSpace(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(label, MARGIN_X, cursorY);
    cursorY += 6;
  };

  const addParagraph = (text: string, options?: { color?: [number, number, number]; size?: number; indent?: number }) => {
    const size = options?.size ?? 10;
    const indent = options?.indent ?? 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    const color = options?.color ?? [225, 225, 230];
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - indent);
    const lineHeight = size * 0.46;
    ensureSpace(lines.length * lineHeight + 2);
    doc.text(lines, MARGIN_X + indent, cursorY);
    cursorY += lines.length * lineHeight + 2;
  };

  const addInfoGrid = (items: Array<{ label: string; value: string }>, columns = 2) => {
    const gap = 4;
    const boxWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
    const rows = Array.from({ length: Math.ceil(items.length / columns) }, (_, rowIndex) =>
      items.slice(rowIndex * columns, rowIndex * columns + columns),
    );

    for (const row of rows) {
      let rowHeight = 0;
      const measured = row.map((item) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const valueLines = doc.splitTextToSize(item.value || '—', boxWidth - 8);
        const height = 16 + valueLines.length * 4;
        rowHeight = Math.max(rowHeight, height);
        return { ...item, valueLines };
      });

      ensureSpace(rowHeight + 4);

      measured.forEach((item, columnIndex) => {
        const x = MARGIN_X + columnIndex * (boxWidth + gap);
        doc.setFillColor(16, 16, 20);
        doc.setDrawColor(38, 38, 42);
        doc.roundedRect(x, cursorY, boxWidth, rowHeight, 4, 4, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 165);
        doc.text(item.label, x + 4, cursorY + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(item.valueLines, x + 4, cursorY + 12);
      });

      cursorY += rowHeight + 4;
    }
  };

  return { doc, addSectionTitle, addParagraph, addInfoGrid, getCursorY: () => cursorY, setCursorY: (value: number) => { cursorY = value; } };
};

export const downloadDietPrescriptionPdf = async (prescription: DietPrescription) => {
  const structuredPlan = prescription.structured_plan;

  if (!structuredPlan) {
    if (prescription.file_path) {
      window.open(prescription.file_path, '_blank', 'noopener,noreferrer');
      return;
    }

    throw new Error('Este plano alimentar nao possui dados suficientes para exportacao.');
  }

  const pdf = await createBasePdf(
    prescription.plan_name,
    `Plano alimentar | Data do plano: ${formatDate(prescription.created_at)}`,
  );

  pdf.addSectionTitle('Resumo do plano');
  pdf.addInfoGrid([
    { label: 'Cliente', value: structuredPlan.header.user_name || 'Cliente' },
    { label: 'Contato', value: structuredPlan.header.contact || 'Nao informado' },
    { label: 'Idade', value: structuredPlan.header.age || '—' },
    { label: 'Peso', value: structuredPlan.header.weight || '—' },
    { label: 'Objetivo', value: structuredPlan.header.objective || 'Nao informado' },
    { label: 'Calorias por dia', value: `${structuredPlan.header.estimated_calories_kcal ?? '—'} Kcal` },
    { label: 'Proteinas', value: `${structuredPlan.header.macros.proteins_g ?? '—'}g` },
    { label: 'Carboidratos', value: `${structuredPlan.header.macros.carbs_g ?? '—'}g` },
    { label: 'Gorduras', value: `${structuredPlan.header.macros.fats_g ?? '—'}g` },
    { label: 'Hidratacao', value: structuredPlan.observations.hydration || 'Nao informada' },
  ]);

  structuredPlan.meals.forEach((meal) => {
    pdf.addSectionTitle(`Refeicao ${meal.meal_number} - ${meal.title}`);

    meal.items.forEach((item) => {
      const description = `${item.name}${item.preparation ? ` (${item.preparation})` : ''} ${item.quantity}`.trim();
      pdf.addParagraph(description, { color: [255, 255, 255], size: 10 });

      if (item.substitutions.length > 0) {
        pdf.addParagraph('Opcoes de substituicao:', { color: [160, 160, 165], size: 8, indent: 2 });
        item.substitutions.forEach((substitution) => {
          const substitutionText = `- ${substitution.name}${substitution.quantity ? ` - ${substitution.quantity}` : ''}`;
          pdf.addParagraph(substitutionText, { color: [225, 225, 230], size: 9, indent: 4 });
        });
      }
    });
  });

  if (structuredPlan.observations.extra_notes.length > 0 || structuredPlan.observations.hydration) {
    pdf.addSectionTitle('Observacoes e recomendacoes');

    if (structuredPlan.observations.hydration) {
      pdf.addParagraph(`Hidratacao: ${structuredPlan.observations.hydration}`);
    }

    structuredPlan.observations.extra_notes.forEach((note) => {
      pdf.addParagraph(`- ${note}`);
    });
  }

  pdf.doc.save(`${sanitizeFileName(prescription.plan_name)}.pdf`);
};

export const downloadTrainingPrescriptionPdf = async (prescription: TrainingPrescription) => {
  const structuredPlan = prescription.structured_plan;

  if (!structuredPlan) {
    if (prescription.file_path) {
      window.open(prescription.file_path, '_blank', 'noopener,noreferrer');
      return;
    }

    throw new Error('Este plano de treino nao possui dados suficientes para exportacao.');
  }

  const pdf = await createBasePdf(
    prescription.plan_name,
    `Plano de treino | Data do plano: ${formatDate(prescription.created_at)}`,
  );

  pdf.addSectionTitle('Resumo do plano');
  pdf.addInfoGrid([
    { label: 'Cliente', value: structuredPlan.header.user_name || 'Cliente' },
    { label: 'Contato', value: structuredPlan.header.contact || 'Nao informado' },
    { label: 'Idade', value: structuredPlan.header.age || '—' },
    { label: 'Peso', value: structuredPlan.header.weight || '—' },
    { label: 'Objetivo', value: structuredPlan.header.objective || 'Nao informado' },
    { label: 'Enfase', value: structuredPlan.header.emphasis || 'Nao informada' },
    { label: 'Estimulo', value: structuredPlan.header.stimulus || 'Nao informado' },
    { label: 'Divisao', value: structuredPlan.header.split || 'Nao informada' },
  ]);

  if (structuredPlan.cardio) {
    pdf.addSectionTitle('Cardio semanal');
    pdf.addParagraph(`Protocolo: ${structuredPlan.cardio.protocol || 'Nao informado'}`);
    if (structuredPlan.cardio.frequency) pdf.addParagraph(`Frequencia: ${structuredPlan.cardio.frequency}`);
    if (structuredPlan.cardio.method) pdf.addParagraph(`Metodo: ${structuredPlan.cardio.method}`);
    if (structuredPlan.cardio.duration) pdf.addParagraph(`Duracao: ${structuredPlan.cardio.duration}`);
    if (structuredPlan.cardio.details) pdf.addParagraph(`Detalhes: ${structuredPlan.cardio.details}`);
    if (structuredPlan.cardio.equipment) pdf.addParagraph(`Equipamento: ${structuredPlan.cardio.equipment}`);
  }

  structuredPlan.workouts.forEach((workout) => {
    pdf.addSectionTitle(`Treino ${workout.label} - ${workout.title}`);

    workout.exercises.forEach((exercise) => {
      pdf.addParagraph(`${exercise.name} | ${exercise.prescription}`, { color: [255, 255, 255], size: 10 });
      if (exercise.rest) {
        pdf.addParagraph(`Descanso: ${exercise.rest}`, { color: [160, 160, 165], size: 8, indent: 2 });
      }
      if (exercise.method) {
        pdf.addParagraph(`Metodo: ${exercise.method}`, { color: [160, 160, 165], size: 8, indent: 2 });
      }
    });
  });

  if (structuredPlan.observations.length > 0) {
    pdf.addSectionTitle('Observacoes e recomendacoes');
    structuredPlan.observations.forEach((note) => {
      pdf.addParagraph(`- ${note}`);
    });
  }

  pdf.doc.save(`${sanitizeFileName(prescription.plan_name)}.pdf`);
};
