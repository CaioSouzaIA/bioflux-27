
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Calendar, Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  id: string;
  user_id: string;
  service_type: string;
  status: string;
  created_at: string;
  expires_at?: string | null;
  forms_completed: boolean;
  updated_at?: string | null;
  ltv?: number | null;
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

interface SubscriptionsListProps {
  subscriptions: SubscriptionData[];
}

export const SubscriptionsList: React.FC<SubscriptionsListProps> = ({ subscriptions }) => {
  const { data: recentSubscriptions = [], isLoading } = useQuery({
    queryKey: ['recent-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_subscriptions')
        .select(`
          id,
          user_id,
          service_type,
          status,
          created_at,
          expires_at,
          forms_completed,
          updated_at,
          ltv,
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
        .eq('status', 'ativo')
        .neq('subscription_plans.name', 'Plano ilimitado')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as SubscriptionData[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-500';
      case 'cancelado':
        return 'bg-red-500';
      case 'pendente':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'treino':
        return 'Treino';
      case 'dieta':
        return 'Dieta';
      case 'treino-dieta':
        return 'Treino + Dieta';
      default:
        return serviceType;
    }
  };

  const getRenewalLabel = (ltv: number | null | undefined) => {
    if (!ltv || ltv === 1) return '1ª assinatura';
    return `${ltv}ª renovação`;
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="w-5 h-5" />
          Assinaturas Recentes (10 mais recentes)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-400 text-center py-8">Carregando...</p>
        ) : recentSubscriptions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Nenhuma assinatura encontrada.
          </p>
        ) : (
          <div className="space-y-4">
            {recentSubscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">
                      {subscription.profiles?.first_name} {subscription.profiles?.last_name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {subscription.profiles?.email}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {subscription.subscription_plans?.name} - {getServiceTypeLabel(subscription.service_type)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {subscription.status === 'ativo' && (
                    <span className="text-blue-400 text-xs font-medium mb-1 block">
                      {getRenewalLabel(subscription.ltv)}
                    </span>
                  )}
                  <div className="flex items-center justify-end text-gray-400 text-xs mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(subscription.updated_at || subscription.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                  <p className="text-green-400 text-sm font-medium">
                    R$ {subscription.subscription_plans?.price?.toFixed(2) || '0,00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
