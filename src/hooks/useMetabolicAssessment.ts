
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      
      return assessment;
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
