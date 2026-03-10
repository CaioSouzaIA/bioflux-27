import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export type ExerciseLoadUnit = 'kg' | 'lb' | 'placas';

export interface ExerciseLoadLog {
  id: string;
  user_id: string;
  training_prescription_id: string;
  workout_label: string;
  workout_title: string;
  exercise_name: string;
  load_value: number;
  load_unit: ExerciseLoadUnit;
  created_at: string;
}

export interface ExerciseLoadDraft {
  value: string;
  unit: ExerciseLoadUnit;
}

export const buildExerciseLoadKey = (workoutLabel: string, exerciseName: string) =>
  `${workoutLabel}::${exerciseName}`;

export const useExerciseLoadLogs = (
  userId?: string,
  trainingPrescriptionId?: string,
) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['exercise-load-logs', userId, trainingPrescriptionId],
    queryFn: async () => {
      if (!userId || !trainingPrescriptionId) {
        return [] as ExerciseLoadLog[];
      }

      const { data, error } = await supabase
        .from('exercise_load_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('training_prescription_id', trainingPrescriptionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as ExerciseLoadLog[];
    },
    enabled: !!userId && !!trainingPrescriptionId,
    staleTime: 1000 * 30,
  });

  const latestLoadsMap = new Map<string, ExerciseLoadLog>();

  for (const log of query.data ?? []) {
    const key = buildExerciseLoadKey(log.workout_label, log.exercise_name);
    if (!latestLoadsMap.has(key)) {
      latestLoadsMap.set(key, log);
    }
  }

  const saveLoad = useMutation({
    mutationFn: async ({
      workoutLabel,
      workoutTitle,
      exerciseName,
      loadValue,
      loadUnit,
    }: {
      workoutLabel: string;
      workoutTitle: string;
      exerciseName: string;
      loadValue: number;
      loadUnit: ExerciseLoadUnit;
    }) => {
      if (!userId || !trainingPrescriptionId) {
        throw new Error('Usuário ou treino não identificado.');
      }

      const { data, error } = await supabase
        .from('exercise_load_logs')
        .insert({
          user_id: userId,
          training_prescription_id: trainingPrescriptionId,
          workout_label: workoutLabel,
          workout_title: workoutTitle,
          exercise_name: exerciseName,
          load_value: loadValue,
          load_unit: loadUnit,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as ExerciseLoadLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['exercise-load-logs', userId, trainingPrescriptionId],
      });
    },
  });

  return {
    logs: query.data ?? [],
    latestLoadsMap,
    isLoading: query.isLoading,
    saveLoad,
  };
};
