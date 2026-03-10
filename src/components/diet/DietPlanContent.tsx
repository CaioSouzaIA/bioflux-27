import React from 'react';
import { AlertCircle, Calendar, Droplets, Eye, FileText, Flame, Loader2, Target, UserRound, Weight } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DietPrescription } from '@/hooks/useDietPrescriptions';

interface DietPlanContentProps {
  prescription: DietPrescription;
}

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Data não disponível';

export const DietPlanContent: React.FC<DietPlanContentProps> = ({ prescription }) => {
  const structuredPlan = prescription.structured_plan;

  if (prescription.generation_status === 'pending' || prescription.generation_status === 'processing') {
    return (
      <div className="client-surface-subtle rounded-2xl p-6 text-white">
        <div className="flex items-start gap-3">
          <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-emerald-400" />
          <div className="space-y-2">
            <p className="text-base font-semibold">
              Plano em geração
            </p>
            <p className="text-sm text-white/65">
              O NutriAI está montando a dieta com base na anamnese enviada. Assim que finalizar, este card passa a mostrar as refeições e substituições.
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
            <p className="text-base font-semibold">
              Não foi possível gerar este plano
            </p>
            <p className="text-sm text-white/65">
              {prescription.error_message || 'Ocorreu um erro ao processar os dados da dieta.'}
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
              <p className="text-base font-semibold">
                Prescrição legada em PDF
              </p>
              <p className="text-sm text-white/65">
                Este plano foi salvo no formato antigo. Você ainda pode abrir o PDF, mas as novas dietas passam a aparecer estruturadas no app.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="client-back-button"
              onClick={() => window.open(prescription.file_path!, `_blank`, 'noopener,noreferrer')}
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
            Plano alimentar
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl bg-black/40 p-4 text-sm leading-relaxed text-white/85">
            {prescription.raw_plan_text}
          </pre>
        </div>
      );
    }

    return (
      <div className="client-surface-subtle rounded-2xl p-6 text-white">
        <p className="text-sm text-white/65">
          Este plano ainda não possui dados estruturados para exibição.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="client-surface-subtle rounded-2xl p-4 text-white lg:col-span-2">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/45">
            <UserRound className="h-4 w-4" />
            Perfil do cliente
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-white/45">Nome</p>
              <p className="text-sm font-medium text-white">{structuredPlan.header.user_name || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-xs text-white/45">Contato</p>
              <p className="text-sm font-medium text-white">{structuredPlan.header.contact || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-xs text-white/45">Idade</p>
              <p className="text-sm font-medium text-white">{structuredPlan.header.age || 'Não informada'}</p>
            </div>
            <div>
              <p className="text-xs text-white/45">Peso</p>
              <p className="text-sm font-medium text-white">{structuredPlan.header.weight || 'Não informado'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-white/45">Objetivo</p>
              <p className="text-sm font-medium leading-relaxed text-white">{structuredPlan.header.objective || 'Não informado'}</p>
            </div>
          </div>
        </div>

        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/45">
            <Flame className="h-4 w-4" />
            Calorias
          </div>
          <p className="text-3xl font-semibold text-white">
            {structuredPlan.header.estimated_calories_kcal ?? '—'}
          </p>
          <p className="mt-2 text-sm text-white/60">Kcal estimadas por dia</p>
        </div>

        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/45">
            <Calendar className="h-4 w-4" />
            Histórico
          </div>
          <p className="text-sm font-medium text-white">Criado em {formatDate(prescription.created_at)}</p>
          <p className="mt-2 text-sm text-white/60">
            {prescription.completed_at ? `Finalizado em ${formatDate(prescription.completed_at)}` : 'Ainda em processamento'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/45">
            <Weight className="h-4 w-4" />
            Proteínas
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{structuredPlan.header.macros.proteins_g ?? '—'}g</p>
        </div>
        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/45">
            <Target className="h-4 w-4" />
            Carboidratos
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{structuredPlan.header.macros.carbs_g ?? '—'}g</p>
        </div>
        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/45">
            <Droplets className="h-4 w-4" />
            Gorduras
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{structuredPlan.header.macros.fats_g ?? '—'}g</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {structuredPlan.meals.map((meal) => (
          <AccordionItem
            key={`${prescription.id}-${meal.meal_number}`}
            value={`${prescription.id}-meal-${meal.meal_number}`}
            className="client-surface-subtle overflow-hidden rounded-2xl border border-white/8 px-5"
          >
            <AccordionTrigger className="py-5 text-left text-white hover:no-underline">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                  Refeição {meal.meal_number}
                </p>
                <p className="text-lg font-semibold text-white">
                  {meal.title}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              {meal.items.map((item, index) => (
                <div key={`${meal.meal_number}-${index}`} className="rounded-2xl border border-white/8 bg-black/25 p-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-base font-semibold text-white">
                      {item.name}
                    </p>
                    <p className="text-sm text-white/70">
                      {item.preparation ? `${item.preparation} • ` : ''}
                      {item.quantity || 'Quantidade não informada'}
                    </p>
                  </div>

                  {item.substitutions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                        Opções de substituição
                      </p>
                      <div className="space-y-2">
                        {item.substitutions.map((substitution, substitutionIndex) => (
                          <div
                            key={`${meal.meal_number}-${index}-sub-${substitutionIndex}`}
                            className="rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2 text-sm text-white/80"
                          >
                            <span className="font-medium text-white">{substitution.name}</span>
                            {substitution.quantity ? ` - ${substitution.quantity}` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="client-surface-subtle rounded-2xl p-5 text-white">
        <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/45">
          <FileText className="h-4 w-4" />
          Observações e recomendações
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-white/80">
          {structuredPlan.observations.hydration && (
            <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
              <span className="font-semibold text-white">Hidratação:</span> {structuredPlan.observations.hydration}
            </div>
          )}
          {structuredPlan.observations.extra_notes.length > 0 ? (
            structuredPlan.observations.extra_notes.map((note, index) => (
              <div key={`note-${index}`} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                {note}
              </div>
            ))
          ) : (
            <p className="text-white/55">
              Nenhuma observação adicional registrada para este plano.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
