import React, { useEffect, useMemo, useState } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Activity, AlertCircle, CalendarIcon, Check, ChevronDown, Eye, FileCheck2, FileText, Flame, Loader2, Target, Timer, Weight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExerciseLoadLogs, type ExerciseLoadDraft, type ExerciseLoadUnit, buildExerciseLoadKey } from '@/hooks/useExerciseLoadLogs';
import { useToast } from '@/hooks/use-toast';
import { useWorkoutCheckins } from '@/hooks/useWorkoutCheckins';
import { cn } from '@/lib/utils';
import type { TrainingPrescription } from '@/hooks/useTrainingPrescriptions';

interface TrainingPlanContentProps {
  prescription: TrainingPrescription;
  enableCheckins?: boolean;
}

const extractSplitLabel = (value: string) => {
  const normalizedValue = value?.replace(/\(.*?\)/g, '').trim() || '';
  const tokenMatch = normalizedValue.match(/\b[A-F]{1,6}\b/i);
  return tokenMatch ? tokenMatch[0].toUpperCase() : normalizedValue || '—';
};

const formatAge = (value: string) => {
  const trimmed = value?.trim() || '';
  if (!trimmed) return '—';
  return /\banos?\b/i.test(trimmed) ? trimmed : `${trimmed} anos`;
};

const formatWeight = (value: string) => {
  const trimmed = value?.trim() || '';
  if (!trimmed) return '—';
  const numeric = trimmed.match(/-?\d+(?:[.,]\d+)?/);
  if (!numeric) return trimmed;
  return `${numeric[0].replace(',', '.')} kg`;
};

export const TrainingPlanContent: React.FC<TrainingPlanContentProps> = ({
  prescription,
  enableCheckins = false,
}) => {
  const structuredPlan = prescription.structured_plan;
  const { toast } = useToast();
  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState<string | null>(null);
  const [selectedWorkoutName, setSelectedWorkoutName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string>('');
  const [loadDrafts, setLoadDrafts] = useState<Record<string, ExerciseLoadDraft>>({});
  const { allCheckins, addCheckin } = useWorkoutCheckins(enableCheckins ? prescription.user_id : undefined);
  const { latestLoadsMap, saveLoad } = useExerciseLoadLogs(prescription.user_id, prescription.id);

  const recentCheckins = useMemo(
    () => allCheckins.slice(0, 8),
    [allCheckins],
  );

  const splitLabel = useMemo(
    () => extractSplitLabel(structuredPlan?.header.split || ''),
    [structuredPlan?.header.split],
  );

  const workoutCheckinSummary = useMemo(() => {
    const summary = new Map<string, { total: number; lastDate: string | null }>();

    for (const checkin of allCheckins) {
      const workoutLabelMatch = checkin.workout_division.match(/Treino\s+([A-Z])/i);
      const workoutLabel = workoutLabelMatch?.[1]?.toUpperCase();

      if (!workoutLabel) {
        continue;
      }

      const current = summary.get(workoutLabel) ?? { total: 0, lastDate: null };
      const currentTime = current.lastDate ? new Date(current.lastDate).getTime() : 0;
      const nextTime = new Date(checkin.workout_date).getTime();

      summary.set(workoutLabel, {
        total: current.total + 1,
        lastDate: nextTime > currentTime ? checkin.workout_date : current.lastDate,
      });
    }

    return summary;
  }, [allCheckins]);

  useEffect(() => {
    if (!structuredPlan) {
      return;
    }

    setLoadDrafts((current) => {
      const next = { ...current };

      for (const workout of structuredPlan.workouts) {
        for (const exercise of workout.exercises) {
          const key = buildExerciseLoadKey(workout.label, exercise.name);
          const latestLoad = latestLoadsMap.get(key);

          if (!next[key] && latestLoad) {
            next[key] = {
              value: String(latestLoad.load_value),
              unit: latestLoad.load_unit,
            };
          }
        }
      }

      return next;
    });
  }, [latestLoadsMap, structuredPlan]);

  const updateLoadDraft = (key: string, patch: Partial<ExerciseLoadDraft>) => {
    setLoadDrafts((current) => ({
      ...current,
      [key]: {
        value: current[key]?.value ?? '',
        unit: current[key]?.unit ?? 'kg',
        ...patch,
      },
    }));
  };

  const handleSaveLoad = async ({
    workoutLabel,
    workoutTitle,
    exerciseName,
  }: {
    workoutLabel: string;
    workoutTitle: string;
    exerciseName: string;
  }) => {
    const key = buildExerciseLoadKey(workoutLabel, exerciseName);
    const draft = loadDrafts[key] ?? { value: '', unit: 'kg' as ExerciseLoadUnit };
    const parsedValue = Number(draft.value.replace(',', '.'));

    if (!draft.value.trim() || Number.isNaN(parsedValue)) {
      toast({
        title: 'Carga inválida',
        description: 'Informe um valor numérico válido para a carga.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveLoad.mutateAsync({
        workoutLabel,
        workoutTitle,
        exerciseName,
        loadValue: parsedValue,
        loadUnit: draft.unit,
      });

      toast({
        title: 'Carga registrada',
        description: `${exerciseName}: ${parsedValue} ${draft.unit}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível salvar a carga.';

      toast({
        title: 'Erro ao salvar carga',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const openCheckinModal = (workoutLabel: string, workoutTitle: string) => {
    setSelectedWorkoutKey(workoutLabel);
    setSelectedWorkoutName(`Treino ${workoutLabel} - ${workoutTitle}`);
    setSelectedDate(new Date());
    setIsCalendarOpen(false);
    setIsDialogOpen(true);
  };

  const handleSaveCheckin = async () => {
    if (!selectedWorkoutName.trim()) {
      return;
    }

    try {
      await addCheckin.mutateAsync({
        workout_division: selectedWorkoutName,
        workout_date: format(selectedDate, 'yyyy-MM-dd'),
      });

      toast({
        title: 'Check-in registrado!',
        description: `${selectedWorkoutName} foi salvo com sucesso.`,
      });

      setIsDialogOpen(false);
      setSelectedWorkoutKey(null);
      setSelectedWorkoutName('');
      setSelectedDate(new Date());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível registrar o check-in.';

      toast({
        title: 'Erro ao registrar treino',
        description: message,
        variant: 'destructive',
      });
    }
  };

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
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Idade</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatAge(structuredPlan.header.age)}</p>
        </div>

        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Peso</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatWeight(structuredPlan.header.weight)}</p>
        </div>

        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/45">
            <Flame className="h-4 w-4" />
            Estímulo
          </div>
          <p className="text-3xl font-semibold text-white">{structuredPlan.header.stimulus || '—'}</p>
        </div>

        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/45">
            <Target className="h-4 w-4" />
            Divisão
          </div>
          <p className="text-3xl font-semibold text-white">{splitLabel}</p>
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
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Ênfase</p>
          <p className="mt-3 text-lg font-semibold leading-relaxed text-white">
            {structuredPlan.header.emphasis || 'Não informada'}
          </p>
        </div>
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

      <Accordion
        type="single"
        collapsible
        value={expandedWorkout}
        onValueChange={(value) => setExpandedWorkout(value)}
        className="space-y-4"
      >
        {structuredPlan.workouts.map((workout) => (
          <AccordionItem
            key={`${prescription.id}-${workout.label}`}
            value={`${prescription.id}-workout-${workout.label}`}
            className="group client-surface-subtle overflow-hidden rounded-2xl border border-white/8 px-5"
          >
            <div className="flex items-center gap-3 py-5">
              <div className="flex-1 space-y-1 text-left">
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Treino {workout.label}</p>
                <p className="text-lg font-semibold text-white">{workout.title}</p>
                {expandedWorkout !== `${prescription.id}-workout-${workout.label}` && (() => {
                  const summary = workoutCheckinSummary.get(workout.label) ?? {
                    total: 0,
                    lastDate: null,
                  };

                  return (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-white/60">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        {summary.total}x executado
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                        {summary.lastDate
                          ? `Última execução: ${format(new Date(summary.lastDate), 'dd/MM/yyyy', { locale: ptBR })}`
                          : 'Sem registro'}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {enableCheckins && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="client-back-button h-10 w-10 shrink-0 rounded-xl"
                    onClick={() => openCheckinModal(workout.label, workout.title)}
                    disabled={addCheckin.isPending}
                  >
                    {addCheckin.isPending && selectedWorkoutKey === workout.label ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileCheck2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger className="inline-flex h-10 w-10 items-center justify-center bg-transparent text-white/70 transition-all hover:text-white [&[data-state=open]>svg]:rotate-180">
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
              </div>
            </div>
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
                    {(() => {
                      const exerciseKey = buildExerciseLoadKey(workout.label, exercise.name);
                      const draft = loadDrafts[exerciseKey] ?? { value: '', unit: 'kg' as ExerciseLoadUnit };
                      const latestLoad = latestLoadsMap.get(exerciseKey);

                      return (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                            <Weight className="h-3.5 w-3.5" />
                            Carga
                          </div>
                          <div className="space-y-2 md:grid md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-center md:gap-2 md:space-y-0">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={draft.value}
                              onChange={(event) => updateLoadDraft(exerciseKey, { value: event.target.value })}
                              placeholder="Digite a carga"
                              className="rounded-xl border-white/10 bg-black/70 text-white placeholder:text-white/35 focus-visible:ring-white/15"
                            />
                            <div className="flex items-center gap-2 md:contents">
                              <Select
                                value={draft.unit}
                                onValueChange={(value) => updateLoadDraft(exerciseKey, { unit: value as ExerciseLoadUnit })}
                              >
                                <SelectTrigger className="flex-1 rounded-xl border-white/10 bg-black/70 text-white md:w-full">
                                  <SelectValue placeholder="Unidade" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="lb">lb</SelectItem>
                                  <SelectItem value="placas">placas</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="outline"
                                className="client-back-button rounded-xl px-4"
                                onClick={() =>
                                  handleSaveLoad({
                                    workoutLabel: workout.label,
                                    workoutTitle: workout.title,
                                    exerciseName: exercise.name,
                                  })
                                }
                                disabled={saveLoad.isPending}
                              >
                                Salvar
                              </Button>
                            </div>
                          </div>
                          {latestLoad && (
                            <p className="text-xs text-white/45">
                              Último registro: {latestLoad.load_value} {latestLoad.load_unit}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {enableCheckins && (
        <div className="client-surface-subtle rounded-2xl p-4 text-white">
          <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/45">
            <Check className="h-4 w-4" />
            Check-ins registrados
          </div>
          {recentCheckins.length > 0 ? (
            <div className="space-y-3">
              {recentCheckins.map((checkin) => (
                <div
                  key={checkin.id}
                  className="client-surface-subtle flex flex-col gap-1 rounded-2xl px-4 py-3 text-sm text-white/80 md:flex-row md:items-center md:justify-between"
                >
                  <span className="font-medium text-white">{checkin.workout_division}</span>
                  <span className="text-white/60">
                    {format(new Date(checkin.workout_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/55">Nenhum treino registrado ainda nesta aba.</p>
          )}
        </div>
      )}

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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar check-in</DialogTitle>
            <DialogDescription>
              Salve a data do treino diretamente nesta aba.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workout-name" className="text-white">
                Treino
              </Label>
              <Input
                id="workout-name"
                value={selectedWorkoutName}
                readOnly
                className="rounded-xl border-white/10 bg-black/70 text-white placeholder:text-white/35 focus-visible:ring-white/15"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Data do treino</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start gap-2 rounded-xl border border-white/10 bg-black/70 text-white transition-colors hover:bg-black/85 hover:text-white',
                      !selectedDate && 'text-white/50'
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {selectedDate
                      ? format(selectedDate, 'PPP', { locale: ptBR })
                      : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.98)_0%,rgba(8,8,11,0.98)_100%)] p-0 text-white"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date || new Date());
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                    locale={ptBR}
                    className="rounded-xl"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="client-back-button"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="client-action-button"
              onClick={handleSaveCheckin}
              disabled={addCheckin.isPending}
            >
              {addCheckin.isPending ? 'Salvando...' : 'Salvar check-in'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
