import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Activity, Gauge, BookOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTrainingPeriodization } from '@/hooks/useTrainingPeriodization';

interface TrainingPeriodizationProps {
  userId: string;
}

export const TrainingPeriodization: React.FC<TrainingPeriodizationProps> = ({ userId }) => {
  const { data: periodization, isLoading, error } = useTrainingPeriodization(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="client-surface-panel rounded-3xl animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="client-surface-panel rounded-3xl">
        <CardContent className="p-12 text-center">
          <div className="text-red-500 mb-4">
            <Activity className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Erro ao Carregar Periodização
            </h3>
            <p className="text-white">
              Não foi possível carregar os dados da periodização de treino.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!periodization) {
    return (
      <Card className="client-surface-panel rounded-3xl">
        <CardContent className="p-12 text-center">
          <Activity className="mx-auto mb-4 h-16 w-16 text-white/28" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhuma Periodização Encontrada
          </h3>
          <p className="text-white">
            Você ainda não possui uma periodização de treino ativa.
          </p>
          <p className="mt-2 text-sm text-white">
            A periodização será criada automaticamente quando você receber uma nova prescrição de treino.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="client-surface-panel rounded-3xl">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="client-surface-subtle rounded-xl border-red-500/20 bg-red-500/10 p-2">
                <Activity className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">
                  Periodização de Treino Atual
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4" />
                  Atualizado em: {format(new Date(periodization.updated_at), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-green-400/40 bg-green-400/10 text-green-300">
              Ativo
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Informações da Periodização */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="client-surface-panel rounded-3xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <Target className="w-5 h-5 text-red-500" />
              Objetivo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white leading-relaxed">
              {periodization.current_objective}
            </p>
          </CardContent>
        </Card>

        <Card className="client-surface-panel rounded-3xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <Activity className="w-5 h-5 text-red-500" />
              Volume de Treino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white leading-relaxed">
              {periodization.training_volume}
            </p>
          </CardContent>
        </Card>

        <Card className="client-surface-panel rounded-3xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <Gauge className="w-5 h-5 text-red-500" />
              Intensidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white leading-relaxed">
              {periodization.intensity}
            </p>
          </CardContent>
        </Card>

        <Card className="client-surface-panel rounded-3xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-red-500" />
              Métodos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white leading-relaxed">
              {periodization.methods}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};