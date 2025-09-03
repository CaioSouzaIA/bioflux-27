
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrainingPrescription {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  form_response_id?: string;
}

export const useTrainingPrescriptions = (userId?: string) => {
  return useQuery({
    queryKey: ['training-prescriptions', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('🔍 [TRAINING-PRESCRIPTIONS] No user ID provided');
        return [];
      }

      console.log(`🔍 [TRAINING-PRESCRIPTIONS] Fetching training prescriptions for user: ${userId}`);
      
      const { data: prescriptions, error } = await supabase
        .from('training_prescriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [TRAINING-PRESCRIPTIONS] Error fetching training prescriptions:', error);
        throw error;
      }

      console.log(`✅ [TRAINING-PRESCRIPTIONS] Found ${prescriptions?.length || 0} training prescriptions`);
      
      return (prescriptions || []) as TrainingPrescription[];
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
