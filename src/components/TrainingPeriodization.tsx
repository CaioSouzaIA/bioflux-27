import React, { useMemo, useState } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Activity, BookOpen, Calendar, ChevronDown, Gauge, History, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrainingPeriodization, type TrainingPeriodization as TrainingPeriodizationItem } from '@/hooks/useTrainingPeriodization';

interface TrainingPeriodizationProps {
  userId: string;
  currentTrainingPrescriptionId?: string;
}

const formatDateTime = (value: string) =>
  format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

const renderWorkoutPreview = (workouts?: TrainingPeriodizationItem['workouts']) => {
  if (!workouts?.length) {
    return null;
  }

  return workouts.slice(0, 3).map((workout) => workout.label || workout.title).join(' • ');
};

const PeriodizationOverviewCards: React.FC<{ periodization: TrainingPeriodizationItem }> = ({ periodization }) => (
  <div className="grid gap-6 md:grid-cols-2">
    <Card className="client-surface-panel rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <Target className="h-5 w-5 text-red-500" />
          Objetivo Atual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed text-white">{periodization.current_objective}</p>
      </CardContent>
    </Card>

    <Card className="client-surface-panel rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <Activity className="h-5 w-5 text-red-500" />
          Volume de Treino
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed text-white">{periodization.training_volume}</p>
      </CardContent>
    </Card>

    <Card className="client-surface-panel rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <Gauge className="h-5 w-5 text-red-500" />
          Intensidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed text-white">{periodization.intensity}</p>
      </CardContent>
    </Card>

    <Card className="client-surface-panel rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <BookOpen className="h-5 w-5 text-red-500" />
          Métodos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed text-white">{periodization.methods}</p>
      </CardContent>
    </Card>
  </div>
);

export const TrainingPeriodization: React.FC<TrainingPeriodizationProps> = ({
  userId,
  currentTrainingPrescriptionId,
}) => {
  const { data: periodizations = [], isLoading, error } = useTrainingPeriodization(userId);
  const [expandedHistoryItem, setExpandedHistoryItem] = useState('');

  const currentPeriodization = useMemo(() => {
    if (!periodizations.length) {
      return null;
    }

    if (currentTrainingPrescriptionId) {
      const linkedPeriodization = periodizations.find(
        (periodization) => periodization.training_prescription_id === currentTrainingPrescriptionId,
      );

      if (linkedPeriodization) {
        return linkedPeriodization;
      }
    }

    return periodizations.find((periodization) => periodization.status === 'active') ?? periodizations[0];
  }, [currentTrainingPrescriptionId, periodizations]);

  const historyPeriodizations = useMemo(
    () => periodizations.filter((periodization) => periodization.id !== currentPeriodization?.id),
    [currentPeriodization?.id, periodizations],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="client-surface-panel rounded-3xl animate-pulse">
          <CardContent className="p-6">
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-700"></div>
            <div className="h-3 w-1/2 rounded bg-gray-700"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="client-surface-panel rounded-3xl">
        <CardContent className="p-12 text-center">
          <div className="mb-4 text-red-500">
            <Activity className="mx-auto mb-4 h-16 w-16" />
            <h3 className="mb-2 text-xl font-semibold text-white">Erro ao Carregar Periodização</h3>
            <p className="text-white">Não foi possível carregar os dados da periodização de treino.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentPeriodization) {
    return (
      <Card className="client-surface-panel rounded-3xl">
        <CardContent className="p-12 text-center">
          <Activity className="mx-auto mb-4 h-16 w-16 text-white/28" />
          <h3 className="mb-2 text-xl font-semibold text-white">Nenhuma Periodização Encontrada</h3>
          <p className="text-white">Você ainda não possui uma periodização de treino ativa.</p>
          <p className="mt-2 text-sm text-white">
            A periodização será criada automaticamente quando você receber uma nova prescrição de treino.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="client-surface-panel rounded-3xl">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="client-surface-subtle rounded-xl border-red-500/20 bg-red-500/10 p-2">
                <Activity className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Periodização da Prescrição Atual</CardTitle>
                <CardDescription className="flex items-center gap-2 text-white">
                  <Calendar className="h-4 w-4" />
                  Atualizado em: {formatDateTime(currentPeriodization.updated_at)}
                </CardDescription>
              </div>
            </div>

            <Badge variant="outline" className="border-green-400/40 bg-green-400/10 text-green-300">
              Atual
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <PeriodizationOverviewCards periodization={currentPeriodization} />

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
            <History className="h-5 w-5 text-white/70" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Registro de periodizações anteriores</h3>
            <p className="mt-1 text-sm text-white/60">
              Histórico das análises geradas para prescrições passadas.
            </p>
          </div>
        </div>

        {!historyPeriodizations.length ? (
          <Card className="client-surface-panel rounded-3xl">
            <CardContent className="p-6">
              <p className="text-sm text-white/60">Ainda não existem registros anteriores de periodização.</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion
            type="single"
            collapsible
            value={expandedHistoryItem}
            onValueChange={setExpandedHistoryItem}
            className="space-y-4"
          >
            {historyPeriodizations.map((periodization) => {
              const accordionValue = periodization.id;
              const workoutPreview = renderWorkoutPreview(periodization.workouts);

              return (
                <AccordionItem
                  key={periodization.id}
                  value={accordionValue}
                  className="group client-surface-panel overflow-hidden rounded-3xl border border-white/10 px-6"
                >
                  <div className="flex items-start gap-4 py-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-white">{periodization.current_objective}</p>
                        <Badge
                          variant="outline"
                          className="border-white/15 bg-white/5 text-white/70"
                        >
                          Registro
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-white/55">
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Atualizado em: {formatDateTime(periodization.updated_at)}
                        </span>
                      </div>

                      {expandedHistoryItem !== accordionValue && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                            {periodization.training_volume}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                            {periodization.intensity}
                          </span>
                          <span className="max-w-full truncate rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                            {periodization.methods}
                          </span>
                          {workoutPreview && (
                            <span className="max-w-full truncate rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                              {workoutPreview}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <AccordionPrimitive.Header className="flex">
                      <AccordionPrimitive.Trigger className="inline-flex h-10 w-10 items-center justify-center bg-transparent text-white/70 transition-all hover:text-white [&[data-state=open]>svg]:rotate-180">
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      </AccordionPrimitive.Trigger>
                    </AccordionPrimitive.Header>
                  </div>

                  <AccordionContent className="space-y-6 pb-6">
                    <PeriodizationOverviewCards periodization={periodization} />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
};
