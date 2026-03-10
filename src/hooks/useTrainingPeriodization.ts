
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StructuredTrainingWorkout } from '@/types/training';

export interface TrainingPeriodization {
  id: string;
  user_id: string;
  training_prescription_id?: string;
  current_objective: string;
  training_volume: string;
  intensity: string;
  methods: string;
  created_at: string;
  updated_at: string;
  status: string;
  workouts?: StructuredTrainingWorkout[] | null;
}

export const useTrainingPeriodization = (userId?: string) => {
  return useQuery({
    queryKey: ['training-periodization', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('🔍 [TRAINING-PERIODIZATION] No user ID provided');
        return null;
      }

      console.log(`🔍 [TRAINING-PERIODIZATION] Fetching training periodization for user: ${userId}`);
      
      const { data: periodization, error } = await supabase
        .from('training_periodization')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('❌ [TRAINING-PERIODIZATION] Error fetching training periodization:', error);
        throw error;
      }

      console.log(`✅ [TRAINING-PERIODIZATION] Found periodization:`, periodization);
      
      return periodization as TrainingPeriodization | null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 15, // 15 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false, // Não refaz a query quando volta o foco
    refetchOnMount: false, // Não refaz a query ao montar se já tem dados
    retry: 3,
    retryDelay: 1000,
  });
};
