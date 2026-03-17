import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarIcon, Dumbbell, Loader2, Trash2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useWorkoutCheckins } from '@/hooks/useWorkoutCheckins';
import { useTrainingPrescriptions } from '@/hooks/useTrainingPrescriptions';
import { cn } from '@/lib/utils';

const WorkoutCheckin: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [workoutDivision, setWorkoutDivision] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data: trainingPrescriptions = [] } = useTrainingPrescriptions(user?.id);
  const currentTrainingPrescription = trainingPrescriptions[0];

  const {
    weeklyCheckins,
    allCheckins,
    isLoading,
    addCheckin,
    deleteCheckin,
  } = useWorkoutCheckins(user?.id, {
    startDate: currentTrainingPrescription?.created_at ?? null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workoutDivision.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe a divisão de treino.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addCheckin.mutateAsync({
        workout_division: workoutDivision,
        workout_date: format(selectedDate, 'yyyy-MM-dd'),
      });

      toast({
        title: 'Check-in registrado!',
        description: 'Seu treino foi registrado com sucesso.',
      });

      setWorkoutDivision('');
      setSelectedDate(new Date());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível registrar o check-in.';
      toast({
        title: 'Erro ao registrar check-in',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    navigate('/client');
  };

  const handleDelete = async (checkinId: string) => {
    if (deleteCheckin.isPending) {
      return;
    }

    setDeletingId(checkinId);

    try {
      await deleteCheckin.mutateAsync(checkinId);
      toast({
        title: 'Check-in removido',
        description: 'O registro de treino foi excluído.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível remover o check-in.';
      toast({
        title: 'Erro ao remover treino',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <BackgroundAnimation />

      <div className="relative z-10">
        <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="client-back-button gap-2 px-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <img
                src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png"
                alt="Bioflux.ai"
                className="h-10 w-auto"
              />
            </div>
            <div>
              <h1 className="text-3xl font-semibold leading-tight">Check-in de Treino</h1>
              <p className="mt-1 text-sm text-white/60">
                Registre seus treinos e acompanhe sua frequência semanal em um só lugar.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="client-surface-panel text-white rounded-3xl lg:col-span-2">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Dumbbell className="h-5 w-5 text-emerald-400" />
                  Registrar novo treino
                </CardTitle>
                <CardDescription className="text-white/60">
                  Informe a divisão e a data para manter os registros organizados pelo treino atual.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="division" className="text-sm font-medium text-white">
                      Divisão de treino
                    </Label>
                    <Input
                      id="division"
                      value={workoutDivision}
                      onChange={(e) => setWorkoutDivision(e.target.value)}
                      placeholder="Ex: Treino A - Peito e Tríceps"
                      className="client-input-surface !text-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Data do treino</Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'client-input-surface w-full justify-start gap-2 rounded-xl !text-black transition-colors hover:bg-white/[0.06] hover:!text-black',
                            !selectedDate && '!text-black/50'
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

                  <Button
                    type="submit"
                    className="client-action-button w-full rounded-xl"
                    disabled={addCheckin.isPending}
                  >
                    {addCheckin.isPending ? 'Registrando...' : 'Registrar treino'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="client-surface-panel text-white rounded-3xl">
              <CardHeader className="space-y-2">
                <CardTitle className="text-white">Frequência semanal</CardTitle>
                <CardDescription className="text-white/60">
                  Semana de {format(startOfWeek(new Date(), { locale: ptBR }), 'dd/MM')} a{' '}
                  {format(endOfWeek(new Date(), { locale: ptBR }), 'dd/MM')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="client-surface-subtle flex flex-col items-center gap-2 rounded-2xl border-emerald-400/20 bg-emerald-500/10 p-6 text-center">
                  <span className="text-5xl font-bold text-emerald-400">
                    {weeklyCheckins.length}/7
                  </span>
                  <p className="text-sm text-white/70">treinos nesta semana</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="client-surface-panel text-white rounded-3xl">
            <CardHeader className="space-y-2">
              <CardTitle className="text-white">Histórico de treinos</CardTitle>
              <CardDescription className="text-white/60">
                Seus registros mais recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-sm text-white/60">Carregando...</p>
              ) : allCheckins.length === 0 ? (
                <p className="text-center text-sm text-white/60">
                  Nenhum treino registrado ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {allCheckins.slice(0, 10).map((checkin) => {
                    const isDeleting = deletingId === checkin.id && deleteCheckin.isPending;
                    return (
                      <div
                        key={checkin.id}
                        className="client-surface-subtle flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
                            <Dumbbell className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{checkin.workout_division}</p>
                            <p className="text-sm text-white/60">
                              {format(new Date(checkin.workout_date), "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleDelete(checkin.id)}
                          className="flex items-center gap-2 self-start rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 md:self-auto"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Removendo...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Remover
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkoutCheckin;
