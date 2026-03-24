import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek } from 'date-fns';
import { getCurrentSaoPauloDate, parseWorkoutDate } from '@/lib/workoutDate';

export interface WorkoutCheckin {
  id: string;
  user_id: string;
  workout_date: string;
  workout_division: string;
  created_at: string;
}

interface UseWorkoutCheckinsOptions {
  startDate?: string | null;
  endDateExclusive?: string | null;
}

const normalizeDateFilter = (value?: string | null) => value?.slice(0, 10) ?? null;

export const useWorkoutCheckins = (
  userId: string | undefined,
  options: UseWorkoutCheckinsOptions = {},
) => {
  const queryClient = useQueryClient();
  const startDate = normalizeDateFilter(options.startDate);
  const endDateExclusive = normalizeDateFilter(options.endDateExclusive);

  // Buscar todos os check-ins do usuário
  const { data: allCheckins = [], isLoading } = useQuery<WorkoutCheckin[]>({
    queryKey: ['workout-checkins', userId, startDate, endDateExclusive],
    queryFn: async () => {
      if (!userId) return [];

      let query = (supabase as any)
        .from('workout_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false });

      if (startDate) {
        query = query.gte('workout_date', startDate);
      }

      if (endDateExclusive) {
        query = query.lt('workout_date', endDateExclusive);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as WorkoutCheckin[];
    },
    enabled: !!userId,
  });

  // Filtrar check-ins da semana atual
  const weeklyCheckins = allCheckins.filter((checkin) => {
    const todayInSaoPaulo = getCurrentSaoPauloDate();
    const checkinDate = parseWorkoutDate(checkin.workout_date);
    const weekStart = startOfWeek(todayInSaoPaulo, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(todayInSaoPaulo, { weekStartsOn: 0 });

    return checkinDate >= weekStart && checkinDate <= weekEnd;
  });

  // Mutation para adicionar novo check-in
  const addCheckin = useMutation({
    mutationFn: async (newCheckin: { workout_division: string; workout_date: string }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { data, error } = await (supabase as any)
        .from('workout_checkins')
        .insert({
          user_id: userId,
          workout_division: newCheckin.workout_division,
          workout_date: newCheckin.workout_date,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-checkins', userId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-workout-checkins'] });
    },
  });

  const deleteCheckin = useMutation({
    mutationFn: async (checkinId: string) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { error } = await (supabase as any)
        .from('workout_checkins')
        .delete()
        .eq('id', checkinId)
        .eq('user_id', userId);

      if (error) throw error;
      return checkinId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-checkins', userId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-workout-checkins'] });
    },
  });

  return {
    allCheckins,
    weeklyCheckins,
    isLoading,
    addCheckin,
    deleteCheckin,
  };
};
