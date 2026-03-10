import React from 'react';
import { Activity, AlertCircle, Eye, FileText, Flame, Loader2, Timer } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import type { TrainingPrescription } from '@/hooks/useTrainingPrescriptions';

interface TrainingPlanContentProps {
  prescription: TrainingPrescription;
}

export const TrainingPlanContent: React.FC<TrainingPlanContentProps> = ({ prescription }) => {
  const structuredPlan = prescription.structured_plan;

  if (prescription.generation_status === 'pending' || prescription.generation_status === 'processing') {
    return (
      <div className="client-surface-subtle rounded-2xl p-6 text-white">
        <div className="flex items-start gap-3">
          <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-orange-400" />
          <div className="space-y-2">
            <p className="text-base font-semibold">Treino em geração</p>
            <p className="text-sm text-white/65">
              O TreinoAI está montando o plano semanal e a periodização. Assim que finalizar, este card passa a mostrar os treinos e o cardio estruturados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (prescription.generation_status === 'failed') {
    return (
      <div className="client-surface-subtle rounded-2xl border border-red-500/20 p-6 text-white">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-400" />
          <div className="space-y-2">
            <p className="text-base font-semibold">Não foi possível gerar este treino</p>
            <p className="text-sm text-white/65">
              {prescription.error_message || 'Ocorreu um erro ao processar os dados do treino.'}
            </p>
            {prescription.raw_plan_text && (
              <pre className="overflow-x-auto rounded-2xl bg-black/40 p-4 text-sm leading-relaxed text-white/80">
                {prescription.raw_plan_text}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!structuredPlan) {
    if (prescription.file_path && prescription.file_name) {
      return (
        <div className="client-surface-subtle rounded-2xl p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-base font-semibold">Prescrição legada em PDF</p>
              <p className="text-sm text-white/65">
                Este treino foi salvo no formato antigo. Você ainda pode abrir o PDF, mas os novos treinos passam a aparecer estruturados no app.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="client-back-button"
              onClick={() => window.open(prescription.file_path!, '_blank', 'noopener,noreferrer')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Abrir PDF
            </Button>
          </div>
        </div>
      );
    }

    if (prescription.raw_plan_text) {
      return (
        <div className="client-surface-subtle rounded-2xl p-6 text-white">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/45">
            <FileText className="h-4 w-4" />
            Plano de treino
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl bg-black/40 p-4 text-sm leading-relaxed text-white/85">
            {prescription.raw_plan_text}
          </pre>
        </div>
      );
    }

    return (
      <div className="client-surface-subtle rounded-2xl p-6 text-white">
        <p className="text-sm text-white/65">Este treino ainda não possui dados estruturados para exibição.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Idade</p>
          <p className="mt-3 text-3xl font-semibold text-white">{structuredPlan.header.age || '—'}</p>
        </div>

        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Peso</p>
          <p className="mt-3 text-3xl font-semibold text-white">{structuredPlan.header.weight || '—'}</p>
        </div>

        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/45">
            <Flame className="h-4 w-4" />
            Estímulo
          </div>
          <p className="text-3xl font-semibold text-white">{structuredPlan.header.stimulus || '—'}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Objetivo</p>
          <p className="mt-3 text-xl font-semibold leading-relaxed text-white">
            {structuredPlan.header.objective || 'Não informado'}
          </p>
        </div>

        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Divisão do treino</p>
          <p className="mt-3 text-xl font-semibold leading-relaxed text-white">
            {structuredPlan.header.split || 'Não informada'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Ênfase</p>
          <p className="mt-3 text-lg font-semibold leading-relaxed text-white">
            {structuredPlan.header.emphasis || 'Não informada'}
          </p>
        </div>

        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/45">
            <Activity className="h-4 w-4" />
            Cardio semanal
          </div>
          {structuredPlan.cardio ? (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-white">{structuredPlan.cardio.method || 'Não informado'}</p>
              <p className="text-sm text-white/70">{structuredPlan.cardio.frequency || 'Frequência não informada'}</p>
              <p className="text-sm text-white/70">{structuredPlan.cardio.duration || 'Duração não informada'}</p>
              {structuredPlan.cardio.details && (
                <p className="text-sm text-white/60">Detalhes: {structuredPlan.cardio.details}</p>
              )}
              {structuredPlan.cardio.equipment && (
                <p className="text-sm text-white/60">Equipamento: {structuredPlan.cardio.equipment}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/65">Cardio não informado neste plano.</p>
          )}
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {structuredPlan.workouts.map((workout) => (
          <AccordionItem
            key={`${prescription.id}-${workout.label}`}
            value={`${prescription.id}-workout-${workout.label}`}
            className="client-surface-subtle overflow-hidden rounded-2xl border border-white/8 px-5"
          >
            <AccordionTrigger className="py-5 text-left text-white hover:no-underline">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Treino {workout.label}</p>
                <p className="text-lg font-semibold text-white">{workout.title}</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              {workout.exercises.map((exercise, index) => (
                <div key={`${workout.label}-${index}`} className="client-surface-subtle rounded-2xl p-4 text-white">
                  <div className="flex flex-col gap-2">
                    <p className="text-base font-semibold text-white">{exercise.name}</p>
                    <p className="text-sm text-white/80">{exercise.prescription || 'Prescrição não informada'}</p>
                    {exercise.rest && (
                      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                        <Timer className="h-3.5 w-3.5" />
                        Descanso: {exercise.rest}
                      </div>
                    )}
                    {exercise.method && (
                      <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                        Método: {exercise.method}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem
          value={`${prescription.id}-observations`}
          className="client-surface-subtle overflow-hidden rounded-2xl border border-white/8 px-5"
        >
          <AccordionTrigger className="py-5 text-left text-white hover:no-underline">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/45">
              <FileText className="h-4 w-4" />
              Observações e recomendações
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-5 text-sm leading-relaxed text-white/80">
            {structuredPlan.observations.length > 0 ? (
              structuredPlan.observations.map((note, index) => (
                <div key={`training-note-${index}`} className="client-surface-subtle rounded-2xl px-4 py-3">
                  {note}
                </div>
              ))
            ) : (
              <p className="text-white/55">Nenhuma observação adicional registrada para este treino.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
