import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { StructuredTrainingPlan, TrainingGenerationStatus } from '@/types/training';

export interface TrainingPrescription {
  id: string;
  user_id: string;
  form_response_id: string | null;
  file_path: string | null;
  file_name: string | null;
  plan_name: string;
  plan_sequence: number;
  generation_status: TrainingGenerationStatus;
  structured_plan: StructuredTrainingPlan | null;
  raw_plan_text: string | null;
  generation_payload: Record<string, unknown> | null;
  model_slug: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
  status: 'active' | 'archived' | null;
}

export const useTrainingPrescriptions = (userId?: string) =>
  useQuery({
    queryKey: ['training-prescriptions', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('training_prescriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as TrainingPrescription[];
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const items = query.state.data as TrainingPrescription[] | undefined;
      return items?.some((item) => item.generation_status === 'pending' || item.generation_status === 'processing')
        ? 5000
        : false;
    },
  });
