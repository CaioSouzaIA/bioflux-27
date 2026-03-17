import React from 'react';
import { AlertCircle, Calendar, ChevronRight, Download, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TrainingPrescription } from '@/hooks/useTrainingPrescriptions';
import { useToast } from '@/hooks/use-toast';
import { downloadTrainingPrescriptionPdf } from '@/lib/prescription-pdf';

interface TrainingPrescriptionViewerProps {
  prescriptions: TrainingPrescription[];
  isLoading: boolean;
  enableCheckins?: boolean;
}

const statusMap: Record<TrainingPrescription['generation_status'], { label: string; className: string }> = {
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

const extractSplitLabel = (value: string) => {
  const normalizedValue = value?.replace(/\(.*?\)/g, '').trim() || '';
  const tokenMatch = normalizedValue.match(/\b[A-F]{1,6}\b/i);
  return tokenMatch ? tokenMatch[0].toUpperCase() : normalizedValue || 'Divisão não informada';
};

export const TrainingPrescriptionViewer: React.FC<TrainingPrescriptionViewerProps> = ({
  prescriptions,
  isLoading,
  enableCheckins = false,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();

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
          <Dumbbell className="mx-auto mb-4 h-16 w-16 text-white/25" />
          <h3 className="mb-2 text-xl font-semibold text-white">Nenhum plano de treino disponível</h3>
          <p className="text-sm text-white/60">
            Assim que a anamnese de treino for enviada, o plano aparece aqui em formato estruturado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription) => {
        const status = statusMap[prescription.generation_status];
        const shouldShowStatusBadge = prescription.generation_status !== 'completed';
        const previewPlan = prescription.structured_plan;
        const isCurrentPrescription = prescriptions[0]?.id === prescription.id;

        return (
          <Card
            key={prescription.id}
            className="group client-surface-panel overflow-hidden rounded-3xl border border-white/10"
          >
            <CardContent className="p-0">
              <div className="flex items-start gap-4 px-6 py-6">
                <button
                  type="button"
                  onClick={() => navigate(`/client/prescriptions/training/${prescription.id}`)}
                  className="flex-1 space-y-3 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-white">{prescription.plan_name}</p>
                    {isCurrentPrescription && (
                      <Badge variant="outline" className="border-emerald-400/40 bg-emerald-400/10 text-emerald-200">
                        Treino atual
                      </Badge>
                    )}
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
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        {previewPlan.header.objective || 'Objetivo não informado'}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        {extractSplitLabel(previewPlan.header.split)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        {previewPlan.header.stimulus || 'Estímulo não informado'}
                      </span>
                    </div>
                  )}

                  {prescription.error_message && prescription.generation_status === 'failed' && (
                    <div className="inline-flex max-w-md items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-200">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span className="truncate">{prescription.error_message}</span>
                    </div>
                  )}
                </button>

                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="client-back-button h-10 w-10 rounded-xl"
                    onClick={async (event) => {
                      event.stopPropagation();

                      try {
                        await downloadTrainingPrescriptionPdf(prescription);
                      } catch (error) {
                        const message = error instanceof Error ? error.message : 'Nao foi possivel baixar o PDF.';
                        toast({
                          title: 'Erro ao baixar PDF',
                          description: message,
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="client-back-button h-10 w-10 rounded-xl"
                    onClick={() => navigate(`/client/prescriptions/training/${prescription.id}`)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {enableCheckins && (
                <div className="border-t border-white/8 bg-white/[0.02] px-6 py-3 text-xs text-white/45">
                  Toque no preview para abrir o treino completo, com check-ins, cardio e exercícios.
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
