
import React from 'react';
import { DashboardStats } from './dashboard/DashboardStats';
import { FinancialTabs } from './dashboard/FinancialTabs';
import { SubscriptionsList } from './dashboard/SubscriptionsList';
import { SalesMetrics } from './dashboard/SalesMetrics';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subHours } from 'date-fns';

export const ManagementDashboard: React.FC = () => {
  const { data: allSubscriptions = [], isLoading, error } = useSubscriptions({ fetchAll: true });

  const subscriptions = React.useMemo(
    () => allSubscriptions.filter((s) => s.profiles?.user_type === 'client'),
    [allSubscriptions]
  );

  // Estatísticas: totais para cada tipo de serviço
  const stats = React.useMemo(() => {
    console.log('📈 [STATS] Calculando estatísticas das assinaturas:', subscriptions);
    
    // Total de assinaturas = total de rows na tabela client_subscriptions
    const total = subscriptions.length;
    
    // Contagem total para cada tipo de serviço
    const dietaCount = subscriptions.filter(s => s.service_type === 'dieta').length;
    const treinoCount = subscriptions.filter(s => s.service_type === 'treino').length;
    const comboCount = subscriptions.filter(s => s.service_type === 'treino-dieta').length;

    console.log('🔢 [STATS] Estatísticas calculadas (totais):', { 
      total, 
      dietaCount, 
      treinoCount, 
      comboCount 
    });

    return {
      total,
      dieta: dietaCount,
      treino: treinoCount,
      combo: comboCount
    };
  }, [subscriptions]);

  // Calcular MRR (apenas receita mensal recorrente)
  const financialStats = React.useMemo(() => {
    console.log('💰 [FINANCIAL] Calculando MRR...');
    
    let mensalTotal = 0;

    // Considerar apenas assinaturas ativas para valores financeiros
    const activeSubscriptions = subscriptions.filter(s => s.status === 'ativo');

    activeSubscriptions.forEach(subscription => {
      const planPrice = subscription.subscription_plans?.price || 0;
      const planName = subscription.subscription_plans?.name || '';
      
      console.log('💵 [FINANCIAL] Processando:', {
        planName,
        planPrice,
        serviceType: subscription.service_type
      });

      mensalTotal += planPrice;
    });

    console.log('💰 [FINANCIAL] MRR calculado:', { mensalTotal });

    return {
      mensalTotal
    };
  }, [subscriptions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Dashboard de Gestão</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-gray-900 border-gray-700">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-gray-400">Carregando dados das assinaturas...</p>
      </div>
    );
  }

  if (error) {
    console.error('💥 [DASHBOARD] Erro no dashboard:', error);
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Dashboard de Gestão</h2>
        <Card className="bg-red-900 border-red-700">
          <CardHeader>
            <CardTitle className="text-white">Erro ao carregar dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-200">
              Erro: {error.message || 'Erro desconhecido ao carregar assinaturas'}
            </p>
            <p className="text-red-300 text-sm mt-2">
              Verifique o console para mais detalhes ou tente recarregar a página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard de Gestão</h2>
      
      {/* Cards de estatísticas */}
      <DashboardStats stats={stats} />

      {/* MRR - Receita Mensal Recorrente */}
      <FinancialTabs financialStats={financialStats} subscriptions={subscriptions} />

      {/* Métricas de Vendas */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Métricas de Vendas</h3>
        <SalesMetrics subscriptions={subscriptions} />
      </div>

      {/* Lista de assinaturas recentes */}
      <SubscriptionsList subscriptions={subscriptions} />
    </div>
  );
};
