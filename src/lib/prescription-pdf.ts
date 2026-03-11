import { jsPDF } from 'jspdf';

import type { DietPrescription } from '@/hooks/useDietPrescriptions';
import type { TrainingPrescription } from '@/hooks/useTrainingPrescriptions';
import { formatDietItemDescription, formatDietSubstitutionDescription } from '@/lib/diet-format';

const BRAND_LOGO_PATH = '/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png';
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const PAGE_MARGIN_X = 18;
const PAGE_MARGIN_BOTTOM = 16;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;
const CARD_RADIUS = 5;
const FIRST_PAGE_START_Y = 74;
const NEXT_PAGE_START_Y = 32;

type Rgb = [number, number, number];

const COLORS = {
  bg: [8, 8, 11] as Rgb,
  panel: [17, 17, 22] as Rgb,
  panelSoft: [22, 22, 28] as Rgb,
  border: [44, 44, 52] as Rgb,
  text: [244, 244, 246] as Rgb,
  textSoft: [182, 182, 190] as Rgb,
  textMuted: [125, 125, 134] as Rgb,
  accent: [103, 232, 249] as Rgb,
  accentSoft: [17, 41, 48] as Rgb,
  success: [74, 222, 128] as Rgb,
  successSoft: [15, 45, 25] as Rgb,
} as const;

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
      throw new Error('Não foi possível carregar a logo da Bioflux.');
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível converter a logo para PDF.'));
    reader.readAsDataURL(blob);
  });
};

const splitLines = (doc: jsPDF, text: string, width: number) => doc.splitTextToSize(text || '—', width) as string[];

const drawRoundedPanel = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor = COLORS.panel,
  strokeColor = COLORS.border,
) => {
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
  doc.roundedRect(x, y, width, height, CARD_RADIUS, CARD_RADIUS, 'FD');
};

const createBasePdf = async (title: string, subtitle: string) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let cursorY = FIRST_PAGE_START_Y;
  let logoDataUrl: string | null = null;

  try {
    logoDataUrl = await loadImageAsDataUrl(BRAND_LOGO_PATH);
  } catch {
    logoDataUrl = null;
  }

  const drawPageChrome = (isFirstPage: boolean) => {
    doc.setFillColor(COLORS.bg[0], COLORS.bg[1], COLORS.bg[2]);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.setLineWidth(0.35);

    if (logoDataUrl) {
      const logoWidth = isFirstPage ? 52 : 34;
      const logoHeight = isFirstPage ? 16 : 10.5;
      doc.addImage(logoDataUrl, 'PNG', (PAGE_WIDTH - logoWidth) / 2, isFirstPage ? 12 : 10, logoWidth, logoHeight);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isFirstPage ? 18 : 14);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text('BIOFLUX', PAGE_WIDTH / 2, isFirstPage ? 24 : 19, { align: 'center' });
    }

    if (isFirstPage) {
      drawRoundedPanel(doc, PAGE_MARGIN_X, 36, CONTENT_WIDTH, 28, COLORS.panelSoft, COLORS.border);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text(title, PAGE_WIDTH / 2, 47, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(COLORS.textSoft[0], COLORS.textSoft[1], COLORS.textSoft[2]);
      doc.text(subtitle, PAGE_WIDTH / 2, 54, { align: 'center' });

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.line(PAGE_MARGIN_X + 12, 64, PAGE_WIDTH - PAGE_MARGIN_X - 12, 64);
    } else {
      doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
      doc.line(PAGE_MARGIN_X, 25, PAGE_WIDTH - PAGE_MARGIN_X, 25);
    }
  };

  drawPageChrome(true);

  const ensureSpace = (heightNeeded: number) => {
    if (cursorY + heightNeeded <= PAGE_HEIGHT - PAGE_MARGIN_BOTTOM) {
      return;
    }

    doc.addPage();
    drawPageChrome(false);
    cursorY = NEXT_PAGE_START_Y;
  };

  const startNewPage = () => {
    doc.addPage();
    drawPageChrome(false);
    cursorY = NEXT_PAGE_START_Y;
  };

  const addSectionTitle = (label: string, accentColor: Rgb = COLORS.accent) => {
    ensureSpace(16);

    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(PAGE_MARGIN_X, cursorY - 1.5, 2.8, 7.5, 1.4, 1.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    const labelX = PAGE_MARGIN_X + 6;
    doc.text(label, labelX, cursorY + 3.5);

    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    const lineStartX = Math.min(labelX + doc.getTextWidth(label) + 4, PAGE_WIDTH - PAGE_MARGIN_X - 8);
    if (lineStartX < PAGE_WIDTH - PAGE_MARGIN_X) {
      doc.line(lineStartX, cursorY + 1.8, PAGE_WIDTH - PAGE_MARGIN_X, cursorY + 1.8);
    }
    cursorY += 12;
  };

  const addParagraph = (
    text: string,
    options?: { color?: Rgb; size?: number; indent?: number; lineGap?: number; maxWidth?: number },
  ) => {
    const size = options?.size ?? 9.5;
    const indent = options?.indent ?? 0;
    const maxWidth = options?.maxWidth ?? CONTENT_WIDTH - indent;
    const color = options?.color ?? COLORS.textSoft;
    const lines = splitLines(doc, text, maxWidth);
    const lineHeight = size * 0.5;
    const spacing = options?.lineGap ?? 2;

    ensureSpace(lines.length * lineHeight + spacing);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(lines, PAGE_MARGIN_X + indent, cursorY);
    cursorY += lines.length * lineHeight + spacing;
  };

  const addInfoGrid = (items: Array<{ label: string; value: string }>, columns = 2) => {
    const gap = 5;
    const boxWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
    const rows = Array.from({ length: Math.ceil(items.length / columns) }, (_, rowIndex) =>
      items.slice(rowIndex * columns, rowIndex * columns + columns),
    );

    rows.forEach((row) => {
      let rowHeight = 0;
      const measured = row.map((item) => {
        const valueLines = splitLines(doc, item.value || '—', boxWidth - 10);
        const height = 17 + valueLines.length * 4.3;
        rowHeight = Math.max(rowHeight, height);
        return { ...item, valueLines };
      });

      ensureSpace(rowHeight + 4);

      measured.forEach((item, columnIndex) => {
        const x = PAGE_MARGIN_X + columnIndex * (boxWidth + gap);
        drawRoundedPanel(doc, x, cursorY, boxWidth, rowHeight);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
      doc.text(item.label.toUpperCase(), x + 5, cursorY + 6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.text(item.valueLines, x + 5, cursorY + 13);
      });

      cursorY += rowHeight + 6;
    });
  };

  const addBulletList = (items: string[], options?: { bulletColor?: Rgb; textColor?: Rgb; indent?: number }) => {
    items.forEach((item) => {
      ensureSpace(7);
      const bulletX = PAGE_MARGIN_X + (options?.indent ?? 0);
      doc.setFillColor(...(options?.bulletColor ?? COLORS.accent));
      doc.circle(bulletX + 2, cursorY - 1.3, 0.8, 'F');
      addParagraph(item, {
        color: options?.textColor ?? COLORS.textSoft,
        indent: (options?.indent ?? 0) + 6,
        maxWidth: CONTENT_WIDTH - ((options?.indent ?? 0) + 6),
        lineGap: 1.8,
      });
    });
  };

  const addPageNumbers = () => {
    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
      doc.text('BIOFLUX.AI', PAGE_MARGIN_X, PAGE_HEIGHT - 8);
      doc.text(`${page}/${totalPages}`, PAGE_WIDTH - PAGE_MARGIN_X, PAGE_HEIGHT - 8, { align: 'right' });
    }
  };

  return {
    doc,
    ensureSpace,
    addSectionTitle,
    addParagraph,
    addInfoGrid,
    addBulletList,
    addPageNumbers,
    startNewPage,
    getCursorY: () => cursorY,
    setCursorY: (value: number) => {
      cursorY = value;
    },
  };
};

const addDietMealCard = (
  pdf: Awaited<ReturnType<typeof createBasePdf>>,
  meal: NonNullable<DietPrescription['structured_plan']>['meals'][number],
) => {
  const { doc } = pdf;
  const contentLeft = PAGE_MARGIN_X + 7;
  const mealItems = meal.items.flatMap((item) => {
    const description = formatDietItemDescription(item);
    const substitutions = item.substitutions.map((substitution) => formatDietSubstitutionDescription(substitution));

    const descriptionLines = splitLines(doc, description, CONTENT_WIDTH - 14);
    const substitutionLines = substitutions.map((substitution) => splitLines(doc, substitution, CONTENT_WIDTH - 26));
    const substitutionsHeight =
      substitutions.length > 0
        ? 5 + substitutionLines.reduce((total, lines) => total + lines.length * 3.9 + 1.8, 0) + 2
        : 0;
    const baseHeight = descriptionLines.length * 4.4 + 5;

    return {
      description,
      substitutions,
      descriptionLines,
      height: baseHeight + substitutionsHeight,
      substitutionLines,
    };
  });

  let estimatedHeight = 20;
  mealItems.forEach((item) => {
    estimatedHeight += item.height + 5;
  });

  pdf.ensureSpace(estimatedHeight + 6);
  const startY = pdf.getCursorY();
  drawRoundedPanel(doc, PAGE_MARGIN_X, startY, CONTENT_WIDTH, estimatedHeight, COLORS.panel, COLORS.border);

  doc.setFillColor(COLORS.accentSoft[0], COLORS.accentSoft[1], COLORS.accentSoft[2]);
  doc.roundedRect(PAGE_MARGIN_X + 5, startY + 5, 18, 8, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.text(`REF ${meal.meal_number}`, PAGE_MARGIN_X + 14, startY + 10.1, { align: 'center', baseline: 'middle' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(meal.title, PAGE_MARGIN_X + 28, startY + 10.5);

  let innerY = startY + 18;

  mealItems.forEach((item, index) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(item.descriptionLines, contentLeft, innerY);
    innerY += item.descriptionLines.length * 4.4 + 2.5;

    if (item.substitutions.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
      doc.text('Substituições', contentLeft, innerY);
      innerY += 5;

      item.substitutionLines.forEach((lines) => {
        doc.setFillColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
        doc.circle(contentLeft + 2, innerY - 1.2, 0.7, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.4);
        doc.setTextColor(COLORS.textSoft[0], COLORS.textSoft[1], COLORS.textSoft[2]);
        doc.text(lines, contentLeft + 5, innerY);
        innerY += lines.length * 3.9 + 1.8;
      });
    }

    if (index < mealItems.length - 1) {
      const dividerY = innerY + 1.5;
      doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
      doc.line(PAGE_MARGIN_X + 5, dividerY, PAGE_WIDTH - PAGE_MARGIN_X - 5, dividerY);
      innerY = dividerY + 7;
      return;
    }

    innerY += 3;
  });

  pdf.setCursorY(startY + estimatedHeight + 7);
};

const addTrainingWorkoutCard = (
  pdf: Awaited<ReturnType<typeof createBasePdf>>,
  workout: NonNullable<TrainingPrescription['structured_plan']>['workouts'][number],
) => {
  const { doc } = pdf;

  let estimatedHeight = 20;
  workout.exercises.forEach((exercise) => {
    estimatedHeight += splitLines(doc, exercise.name, CONTENT_WIDTH - 28).length * 4.2;
    estimatedHeight += splitLines(doc, exercise.prescription, CONTENT_WIDTH - 28).length * 3.9 + 7;
    if (exercise.rest || exercise.method) {
      estimatedHeight += 5.5;
    }
  });

  pdf.ensureSpace(estimatedHeight + 6);
  const startY = pdf.getCursorY();
  drawRoundedPanel(doc, PAGE_MARGIN_X, startY, CONTENT_WIDTH, estimatedHeight, COLORS.panel, COLORS.border);

  doc.setFillColor(COLORS.accentSoft[0], COLORS.accentSoft[1], COLORS.accentSoft[2]);
  doc.roundedRect(PAGE_MARGIN_X + 5, startY + 5, 16, 8, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.text(workout.label || 'TR', PAGE_MARGIN_X + 13, startY + 10.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(workout.title, PAGE_MARGIN_X + 25, startY + 10.5);

  let innerY = startY + 19;
  workout.exercises.forEach((exercise, index) => {
    if (index > 0) {
      doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
      doc.line(PAGE_MARGIN_X + 5, innerY - 2.5, PAGE_WIDTH - PAGE_MARGIN_X - 5, innerY - 2.5);
    }

    const nameLines = splitLines(doc, exercise.name, CONTENT_WIDTH - 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(nameLines, PAGE_MARGIN_X + 7, innerY);
    innerY += nameLines.length * 4.2 + 0.6;

    const prescriptionLines = splitLines(doc, exercise.prescription, CONTENT_WIDTH - 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(COLORS.textSoft[0], COLORS.textSoft[1], COLORS.textSoft[2]);
    doc.text(prescriptionLines, PAGE_MARGIN_X + 7, innerY);
    innerY += prescriptionLines.length * 3.9 + 2.4;

    const meta: string[] = [];
    if (exercise.rest) meta.push(`Descanso: ${exercise.rest}`);
    if (exercise.method) meta.push(`Método: ${exercise.method}`);

    if (meta.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
      doc.text(meta.join('   |   '), PAGE_MARGIN_X + 7, innerY);
      innerY += 5.5;
    }
  });

  pdf.setCursorY(startY + estimatedHeight + 7);
};

export const downloadDietPrescriptionPdf = async (prescription: DietPrescription) => {
  const structuredPlan = prescription.structured_plan;

  if (!structuredPlan) {
    if (prescription.file_path) {
      window.open(prescription.file_path, '_blank', 'noopener,noreferrer');
      return;
    }

    throw new Error('Este plano alimentar não possui dados suficientes para exportação.');
  }

  const pdf = await createBasePdf(
    prescription.plan_name,
    `Plano alimentar | Data do plano: ${formatDate(prescription.created_at)}`,
  );

  pdf.addSectionTitle('Resumo do plano');
  pdf.addInfoGrid([
    { label: 'Cliente', value: structuredPlan.header.user_name || 'Cliente' },
    { label: 'Contato', value: structuredPlan.header.contact || 'Não informado' },
    { label: 'Idade', value: structuredPlan.header.age || '—' },
    { label: 'Peso', value: structuredPlan.header.weight || '—' },
    { label: 'Objetivo', value: structuredPlan.header.objective || 'Não informado' },
    { label: 'Calorias por dia', value: `${structuredPlan.header.estimated_calories_kcal ?? '—'} kcal` },
    { label: 'Proteínas', value: `${structuredPlan.header.macros.proteins_g ?? '—'} g` },
    { label: 'Carboidratos', value: `${structuredPlan.header.macros.carbs_g ?? '—'} g` },
    { label: 'Gorduras', value: `${structuredPlan.header.macros.fats_g ?? '—'} g` },
    { label: 'Hidratação', value: structuredPlan.observations.hydration || 'Não informada' },
  ]);

  pdf.startNewPage();
  pdf.addSectionTitle('Estrutura das refeições', COLORS.success);
  structuredPlan.meals.forEach((meal) => addDietMealCard(pdf, meal));

  if (structuredPlan.observations.extra_notes.length > 0 || structuredPlan.observations.hydration) {
    pdf.addSectionTitle('Observações e recomendações');

    if (structuredPlan.observations.hydration) {
      pdf.addParagraph(`Hidratação: ${structuredPlan.observations.hydration}`, {
        color: COLORS.text,
      });
    }

    pdf.addBulletList(structuredPlan.observations.extra_notes, {
      bulletColor: COLORS.success,
      textColor: COLORS.textSoft,
    });
  }

  pdf.addPageNumbers();
  pdf.doc.save(`${sanitizeFileName(prescription.plan_name)}.pdf`);
};

export const downloadTrainingPrescriptionPdf = async (prescription: TrainingPrescription) => {
  const structuredPlan = prescription.structured_plan;

  if (!structuredPlan) {
    if (prescription.file_path) {
      window.open(prescription.file_path, '_blank', 'noopener,noreferrer');
      return;
    }

    throw new Error('Este plano de treino não possui dados suficientes para exportação.');
  }

  const pdf = await createBasePdf(
    prescription.plan_name,
    `Plano de treino | Data do plano: ${formatDate(prescription.created_at)}`,
  );

  pdf.addSectionTitle('Resumo do plano');
  pdf.addInfoGrid([
    { label: 'Cliente', value: structuredPlan.header.user_name || 'Cliente' },
    { label: 'Contato', value: structuredPlan.header.contact || 'Não informado' },
    { label: 'Idade', value: structuredPlan.header.age || '—' },
    { label: 'Peso', value: structuredPlan.header.weight || '—' },
    { label: 'Objetivo', value: structuredPlan.header.objective || 'Não informado' },
    { label: 'Ênfase', value: structuredPlan.header.emphasis || 'Não informada' },
    { label: 'Estímulo', value: structuredPlan.header.stimulus || 'Não informado' },
    { label: 'Divisão', value: structuredPlan.header.split || 'Não informada' },
  ]);

  if (structuredPlan.cardio) {
    pdf.addSectionTitle('Cardio semanal', COLORS.success);
    pdf.addInfoGrid([
      { label: 'Protocolo', value: structuredPlan.cardio.protocol || 'Não informado' },
      { label: 'Frequência', value: structuredPlan.cardio.frequency || 'Não informada' },
      { label: 'Método', value: structuredPlan.cardio.method || 'Não informado' },
      { label: 'Duração', value: structuredPlan.cardio.duration || 'Não informada' },
      { label: 'Detalhes', value: structuredPlan.cardio.details || 'Não informados' },
      { label: 'Equipamento', value: structuredPlan.cardio.equipment || 'Não informado' },
    ]);
  }

  pdf.addSectionTitle('Blocos de treino');
  structuredPlan.workouts.forEach((workout) => addTrainingWorkoutCard(pdf, workout));

  if (structuredPlan.observations.length > 0) {
    pdf.addSectionTitle('Observações e recomendações');
    pdf.addBulletList(structuredPlan.observations, {
      bulletColor: COLORS.accent,
      textColor: COLORS.textSoft,
    });
  }

  pdf.addPageNumbers();
  pdf.doc.save(`${sanitizeFileName(prescription.plan_name)}.pdf`);
};
