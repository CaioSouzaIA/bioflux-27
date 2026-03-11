
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MetabolicAssessmentRecord {
  id: string;
  user_id: string;
  age: number;
  weight: number;
  height: number;
  biological_sex: string;
  waist_circumference: number;
  activity_factor: number;
  tmb: number;
  get_value: number;
  created_at: string;
  updated_at: string;
}

export const METABOLIC_ASSESSMENT_MAX_AGE_DAYS = 30;

export const getMetabolicAssessmentAgeInDays = (assessmentDate?: string | null) => {
  if (!assessmentDate) {
    return null;
  }

  const createdAt = new Date(assessmentDate);
  const now = new Date();
  const diffInMs = now.getTime() - createdAt.getTime();

  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
};

export const isMetabolicAssessmentExpired = (assessmentDate?: string | null) => {
  const ageInDays = getMetabolicAssessmentAgeInDays(assessmentDate);

  if (ageInDays === null) {
    return true;
  }

  return ageInDays > METABOLIC_ASSESSMENT_MAX_AGE_DAYS;
};

export const useMetabolicAssessment = (userId?: string) => {
  return useQuery({
    queryKey: ['metabolic-assessment', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('🔍 [METABOLIC-ASSESSMENT] No user ID provided');
        return null;
      }

      console.log(`🔍 [METABOLIC-ASSESSMENT] Checking metabolic assessment for user: ${userId}`);
      
      const { data: assessment, error } = await supabase
        .from('metabolic_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ [METABOLIC-ASSESSMENT] Error fetching metabolic assessment:', error);
        throw error;
      }

      console.log(`✅ [METABOLIC-ASSESSMENT] Assessment found:`, !!assessment);
      
      return (assessment ?? null) as MetabolicAssessmentRecord | null;
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

export const useMetabolicAssessmentHistory = (userId?: string) => {
  return useQuery({
    queryKey: ['metabolic-assessment-history', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('🔍 [METABOLIC-ASSESSMENT] No user ID provided for history');
        return [];
      }

      console.log(`🔍 [METABOLIC-ASSESSMENT] Fetching metabolic assessment history for user: ${userId}`);

      const { data: assessments, error } = await supabase
        .from('metabolic_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [METABOLIC-ASSESSMENT] Error fetching metabolic assessment history:', error);
        throw error;
      }

      console.log(`✅ [METABOLIC-ASSESSMENT] History found:`, assessments?.length ?? 0);

      return (assessments ?? []) as MetabolicAssessmentRecord[];
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
