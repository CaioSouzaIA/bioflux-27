import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Calendar, Award, TriangleAlert as AlertTriangle } from 'lucide-react';
import type { SubscriptionData } from '@/hooks/useSubscriptions';

interface SalesMetricsProps {
  subscriptions: SubscriptionData[];
  selectedMonth?: string;
}

export const SalesMetrics: React.FC<SalesMetricsProps> = ({ subscriptions, selectedMonth = 'all' }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Se um mês específico foi selecionado, usar esse mês; caso contrário, usar o mês atual
  const targetMonth = selectedMonth === 'all' ? now.getMonth() : parseInt(selectedMonth);
  
  const today = new Date(currentYear, targetMonth, now.getDate());
  const monthStart = new Date(currentYear, targetMonth, 1);
  const monthEnd = new Date(currentYear, targetMonth + 1, 0);
  const lastMonth = new Date(currentYear, targetMonth - 1, 1);
  const lastMonthEnd = new Date(currentYear, targetMonth, 0);

  // Filtrar apenas planos pagos, excluir planos ilimitados e gratuitos
  const paidSubscriptions = subscriptions.filter(s =>
    s.subscription_plans?.price &&
    s.subscription_plans.price > 0 &&
    s.subscription_plans.name !== 'Plano Ilimitado - Treino + Dieta'
  );

  // Novas assinaturas e renovações no mês selecionado
  const soldThisMonth = paidSubscriptions.filter(s => {
    const createdAt = new Date(s.created_at);
    return createdAt >= monthStart && createdAt <= monthEnd;
  }).length;

  // Crescimento mensal de usuários
  const usersThisMonth = paidSubscriptions.filter(s => {
    const createdAt = new Date(s.created_at);
    return createdAt >= monthStart && createdAt <= monthEnd;
  }).length;

  const usersLastMonth = paidSubscriptions.filter(s => {
    const createdAt = new Date(s.created_at);
    return createdAt >= lastMonth && createdAt <= lastMonthEnd;
  }).length;

  const monthlyGrowth = usersThisMonth === 0
    ? 0
    : usersLastMonth > 0
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100)
      : 100;

  // Plano mais vendido (excluir planos gratuitos e ilimitados)
  const planCounts = paidSubscriptions
    .filter(s => s.status === 'ativo')
    .reduce((acc, sub) => {
      const planName = sub.subscription_plans?.name || 'Plano Desconhecido';
      acc[planName] = (acc[planName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const mostSoldPlan = Object.entries(planCounts).reduce((max, [name, count]) => 
    count > (max.count || 0) ? { name, count } : max, { name: 'Nenhum', count: 0 }
  );

  // Planos cancelados e expirados
  const cancelledAndExpiredPlans = subscriptions.filter(s => 
    s.status === 'cancelado' || s.status === 'expirado'
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="bg-[#161616] border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Crescimento Mensal</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {monthlyGrowth > 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-400">
            {usersThisMonth} usuários este mês
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#161616] border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Plano Mais Vendido</CardTitle>
          <Award className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white truncate">
            {mostSoldPlan.name}
          </div>
          <p className="text-xs text-gray-400">
            {mostSoldPlan.count} vendas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#161616] border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Vendas no Período</CardTitle>
          <Users className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {soldThisMonth}
          </div>
          <p className="text-xs text-gray-400">
            planos vendidos no período selecionado
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#161616] border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Planos Cancelados/Expirados</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {cancelledAndExpiredPlans}
          </div>
          <p className="text-xs text-gray-400">
            total de cancelamentos e expirações
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
