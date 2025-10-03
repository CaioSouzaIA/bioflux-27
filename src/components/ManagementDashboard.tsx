
import React from 'react';
import { DashboardStats } from './dashboard/DashboardStats';
import { FinancialTabs } from './dashboard/FinancialTabs';
import { SubscriptionsList } from './dashboard/SubscriptionsList';
import { SalesMetrics } from './dashboard/SalesMetrics';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { subHours } from 'date-fns';

export const ManagementDashboard: React.FC = () => {
  const { data: allSubscriptions = [], isLoading, error } = useSubscriptions({ fetchAll: true });
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');

  const months = [
    { value: 'all', label: 'Todos os meses' },
    { value: '0', label: 'Janeiro' },
    { value: '1', label: 'Fevereiro' },
    { value: '2', label: 'Março' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Maio' },
    { value: '5', label: 'Junho' },
    { value: '6', label: 'Julho' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Setembro' },
    { value: '9', label: 'Outubro' },
    { value: '10', label: 'Novembro' },
    { value: '11', label: 'Dezembro' },
  ];

  const subscriptions = React.useMemo(() => {
    const clientSubscriptions = allSubscriptions.filter((s) => s.profiles?.user_type === 'client');
    
    // Se "Todos os meses" estiver selecionado, retornar todas
    if (selectedMonth === 'all') {
      return clientSubscriptions;
    }
    
    // Filtrar por mês específico
    const monthIndex = parseInt(selectedMonth);
    const currentYear = new Date().getFullYear();
    
    return clientSubscriptions.filter(s => {
      const createdDate = new Date(s.created_at);
      return createdDate.getMonth() === monthIndex && createdDate.getFullYear() === currentYear;
    });
  }, [allSubscriptions, selectedMonth]);

  // Estatísticas: totais para cada tipo de serviço (apenas ativas)
  const stats = React.useMemo(() => {
    console.log('📈 [STATS] Calculando estatísticas das assinaturas:', subscriptions);
    
    // Filtrar apenas assinaturas ativas
    const activeSubscriptions = subscriptions.filter(s => s.status === 'ativo');
    
    // Total de assinaturas ativas
    const total = activeSubscriptions.length;
    
    // Contagem total para cada tipo de serviço (apenas ativas)
    const dietaCount = activeSubscriptions.filter(s => s.service_type === 'dieta').length;
    const treinoCount = activeSubscriptions.filter(s => s.service_type === 'treino').length;
    const comboCount = activeSubscriptions.filter(s => s.service_type === 'treino-dieta').length;

    // Calcular % de Churn (canceladas no mês atual / ativas no início do mês)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Assinaturas que estavam ativas no início do mês
    const activeAtStartOfMonth = subscriptions.filter(s => {
      const createdAt = new Date(s.created_at);
      return createdAt < startOfMonth && (s.status === 'ativo' || s.status === 'cancelado');
    }).length;

    // Assinaturas canceladas durante este mês
    const cancelledThisMonth = subscriptions.filter(s => {
      if (s.status !== 'cancelado' || !s.updated_at) return false;
      const updatedAt = new Date(s.updated_at);
      return updatedAt >= startOfMonth && updatedAt <= endOfMonth;
    }).length;

    const churnRate = activeAtStartOfMonth > 0 
      ? ((cancelledThisMonth / activeAtStartOfMonth) * 100).toFixed(1)
      : '0.0';

    // Calcular LTV médio (média da coluna ltv em meses) - SEMPRE usar todas as assinaturas
    const allClientSubscriptions = allSubscriptions.filter(s => s.profiles?.user_type === 'client');
    const subscriptionsWithLtv = allClientSubscriptions.filter(s => s.ltv !== null && s.ltv !== undefined);
    const avgLtv = subscriptionsWithLtv.length > 0
      ? (subscriptionsWithLtv.reduce((sum, s) => sum + (s.ltv || 0), 0) / subscriptionsWithLtv.length).toFixed(1)
      : '0.0';

    console.log('🔢 [STATS] Estatísticas calculadas:', { 
      total, 
      dietaCount, 
      treinoCount, 
      comboCount,
      churnRate,
      avgLtv,
      activeAtStartOfMonth,
      cancelledThisMonth
    });

    return {
      total,
      dieta: dietaCount,
      treino: treinoCount,
      combo: comboCount,
      churnRate: parseFloat(churnRate),
      avgLtv: parseFloat(avgLtv)
    };
  }, [subscriptions, allSubscriptions]);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Dashboard de Gestão</h2>
        
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px] bg-gray-800 border-gray-600 text-white">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Selecionar mês" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600 text-white z-50">
            {months.map((month) => (
              <SelectItem 
                key={month.value} 
                value={month.value}
                className="text-white hover:bg-gray-700 focus:bg-gray-700"
              >
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Cards de estatísticas */}
      <DashboardStats stats={stats} />

      {/* MRR - Receita Mensal Recorrente */}
      <FinancialTabs financialStats={financialStats} subscriptions={subscriptions} />

      {/* Métricas de Vendas */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Métricas de Vendas</h3>
        <SalesMetrics subscriptions={subscriptions} />
      </div>

      {/* Lista de assinaturas recentes (apenas ativas) */}
      <SubscriptionsList subscriptions={subscriptions.filter(s => s.status === 'ativo')} />
    </div>
  );
};
