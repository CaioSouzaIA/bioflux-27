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
import { ArrowLeft, CalendarIcon, Dumbbell } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useWorkoutCheckins } from '@/hooks/useWorkoutCheckins';
import { cn } from '@/lib/utils';

const WorkoutCheckin: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [workoutDivision, setWorkoutDivision] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const {
    weeklyCheckins,
    allCheckins,
    isLoading,
    addCheckin,
  } = useWorkoutCheckins(user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workoutDivision.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe a divisão de treino',
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
        description: 'Seu treino foi registrado com sucesso',
      });

      setWorkoutDivision('');
      setSelectedDate(new Date());
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar check-in',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    navigate('/client');
  };

  return (
    <div className="min-h-screen bg-background">
      <BackgroundAnimation />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="space-y-6">
          {/* Card de registro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Check-in de Treino
              </CardTitle>
              <CardDescription>
                Registre seus treinos e acompanhe sua frequência semanal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="division">Divisão de Treino</Label>
                  <Input
                    id="division"
                    value={workoutDivision}
                    onChange={(e) => setWorkoutDivision(e.target.value)}
                    placeholder="Ex: Treino A - Peito e Tríceps"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data do Treino</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date || new Date());
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button type="submit" className="w-full" disabled={addCheckin.isPending}>
                  {addCheckin.isPending ? 'Registrando...' : 'Registrar Treino'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Card de estatísticas semanais */}
          <Card>
            <CardHeader>
              <CardTitle>Frequência Semanal</CardTitle>
              <CardDescription>
                Semana de {format(startOfWeek(new Date(), { locale: ptBR }), 'dd/MM')} a{' '}
                {format(endOfWeek(new Date(), { locale: ptBR }), 'dd/MM')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">
                  {weeklyCheckins.length}/7
                </div>
                <p className="text-muted-foreground">treinos esta semana</p>
              </div>
            </CardContent>
          </Card>

          {/* Lista de check-ins recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Treinos</CardTitle>
              <CardDescription>
                Seus últimos treinos registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : allCheckins.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  Nenhum treino registrado ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {allCheckins.slice(0, 10).map((checkin) => (
                    <div
                      key={checkin.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <p className="font-medium">{checkin.workout_division}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(checkin.workout_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                  ))}
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
