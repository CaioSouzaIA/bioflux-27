
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface SubscriptionData {
  id: string;
  user_id: string;
  service_type: string;
  status: string;
  created_at: string;
  expires_at?: string | null;
  forms_completed: boolean;
  subscription_plans: {
    id: string;
    name: string;
    price: number;
  } | null;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    user_type: string;
  } | null;
}

export const useSubscriptions = (options: { fetchAll?: boolean } = {}) => {
  const { fetchAll = false } = options;
  const { user, userType } = useAuthContext();
  const userId = user?.id;

  const queryKey = fetchAll && userType === 'admin' ? ['subscriptions', 'all'] : ['subscriptions', userId];
  
  const enabled = fetchAll && userType === 'admin' ? userType === 'admin' : !!userId;

  return useQuery({
    queryKey,
    queryFn: async () => {
      // Primeiro, verificar e resetar formulários automaticamente + atualizar assinaturas expiradas
      if (!fetchAll && userId) {
        console.log('🔄 [SUBSCRIPTIONS] Checking for auto-reset and expired subscriptions...');
        const { error: updateError } = await supabase.rpc('update_expired_subscriptions');
        if (updateError) {
          console.error('❌ [SUBSCRIPTIONS] Error updating subscriptions:', updateError);
        } else {
          console.log('✅ [SUBSCRIPTIONS] Auto-reset and expiration check completed');
        }
      }

      let query = supabase
        .from('client_subscriptions')
        .select(`
          id,
          user_id,
          service_type,
          status,
          created_at,
          expires_at,
          forms_completed,
          subscription_plans (
            id,
            name,
            price
          ),
          profiles (
            id,
            first_name,
            last_name,
            email,
            user_type
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchAll && userType === 'admin') {
        console.log(`🔍 [SUBSCRIPTIONS] Admin fetching all subscriptions.`);
      } else {
        if (!userId) {
          return [];
        }
        console.log(`🔍 [SUBSCRIPTIONS] Fetching subscriptions for user: ${userId}`);
        query = query.eq('user_id', userId);
      }

      const { data: subscriptions, error: subscriptionsError } = await query;

      if (subscriptionsError) {
        console.error('❌ [SUBSCRIPTIONS] Error fetching subscriptions:', subscriptionsError);
        throw subscriptionsError;
      }

      console.log('✅ [SUBSCRIPTIONS] Subscriptions found:', subscriptions?.length || 0);

      return (subscriptions || []) as SubscriptionData[];
    },
    enabled,
    staleTime: 1000 * 60 * 15, // 15 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false, // Não refaz a query quando volta o foco
    refetchOnMount: false, // Não refaz a query ao montar se já tem dados
    retry: 3,
    retryDelay: 1000,
  });
};
