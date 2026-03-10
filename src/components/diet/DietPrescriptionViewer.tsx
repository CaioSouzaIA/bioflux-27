import React from 'react';
import { AlertCircle, Calendar, UtensilsCrossed } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { DietPrescription } from '@/hooks/useDietPrescriptions';
import { DietPlanContent } from './DietPlanContent';

interface DietPrescriptionViewerProps {
  prescriptions: DietPrescription[];
  isLoading: boolean;
}

const statusMap: Record<DietPrescription['generation_status'], { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  },
  processing: {
    label: 'Processando',
    className: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  },
  completed: {
    label: 'Concluído',
    className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  },
  failed: {
    label: 'Falhou',
    className: 'border-red-400/40 bg-red-400/10 text-red-200',
  },
  archived: {
    label: 'Arquivado',
    className: 'border-white/15 bg-white/5 text-white/70',
  },
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export const DietPrescriptionViewer: React.FC<DietPrescriptionViewerProps> = ({
  prescriptions,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((item) => (
          <Card key={item} className="client-surface-panel rounded-3xl animate-pulse">
            <CardContent className="h-32 p-6" />
          </Card>
        ))}
      </div>
    );
  }

  if (!prescriptions.length) {
    return (
      <Card className="client-surface-panel rounded-3xl">
        <CardContent className="py-14 text-center">
          <UtensilsCrossed className="mx-auto mb-4 h-16 w-16 text-white/25" />
          <h3 className="mb-2 text-xl font-semibold text-white">Nenhum plano alimentar disponível</h3>
          <p className="text-sm text-white/60">
            Assim que a anamnese de dieta for enviada, o plano aparece aqui em formato estruturado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-4">
      {prescriptions.map((prescription) => {
        const status = statusMap[prescription.generation_status];
        const shouldShowStatusBadge = prescription.generation_status !== 'completed';
        const previewPlan = prescription.structured_plan;

        return (
          <AccordionItem
            key={prescription.id}
            value={prescription.id}
            className="group client-surface-panel overflow-hidden rounded-3xl border border-white/10 px-6"
          >
            <AccordionTrigger className="py-6 text-left text-white hover:no-underline">
              <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-white">{prescription.plan_name}</p>
                    {shouldShowStatusBadge && (
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    )}
                    {prescription.file_path && !prescription.structured_plan && (
                      <Badge variant="outline" className="border-white/15 bg-white/5 text-white/70">
                        Legado PDF
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/55">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data do plano: {formatDate(prescription.created_at)}
                    </span>
                  </div>
                  {previewPlan && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/60 group-data-[state=open]:hidden">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        {previewPlan.header.estimated_calories_kcal ?? '—'} Kcal
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        Prot: {previewPlan.header.macros.proteins_g ?? '—'}g
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        Carbo: {previewPlan.header.macros.carbs_g ?? '—'}g
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        Gord: {previewPlan.header.macros.fats_g ?? '—'}g
                      </span>
                      <span className="max-w-full truncate rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        {previewPlan.header.objective || 'Objetivo não informado'}
                      </span>
                    </div>
                  )}
                </div>

                {prescription.error_message && prescription.generation_status === 'failed' && (
                  <div className="inline-flex max-w-md items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-200">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="truncate">{prescription.error_message}</span>
                  </div>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <DietPlanContent prescription={prescription} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
