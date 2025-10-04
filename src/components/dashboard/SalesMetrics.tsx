import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Calendar, Award, TriangleAlert as AlertTriangle } from 'lucide-react';
import type { SubscriptionData } from '@/hooks/useSubscriptions';

interface SalesMetricsProps {
  subscriptions: SubscriptionData[];
}

export const SalesMetrics: React.FC<SalesMetricsProps> = ({ subscriptions }) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filtrar apenas NOVAS assinaturas (ltv === 1 ou ltv === null)
  const newSubscriptions = subscriptions.filter(s => !s.ltv || s.ltv === 1);

  // Planos vendidos hoje
  const soldToday = newSubscriptions.filter(s => {
    const createdAt = new Date(s.created_at);
    return createdAt >= today;
  }).length;

  // Planos vendidos esta semana
  const soldThisWeek = newSubscriptions.filter(s => {
    const createdAt = new Date(s.created_at);
    return createdAt >= weekAgo;
  }).length;

  // Planos vendidos este mês
  const soldThisMonth = newSubscriptions.filter(s => {
    const createdAt = new Date(s.created_at);
    return createdAt >= currentMonth;
  }).length;

  // Crescimento mensal de usuários (apenas novos)
  const usersThisMonth = newSubscriptions.filter(s => {
    const createdAt = new Date(s.created_at);
    return createdAt >= currentMonth;
  }).length;

  const usersLastMonth = newSubscriptions.filter(s => {
    const createdAt = new Date(s.created_at);
    return createdAt >= lastMonth && createdAt < currentMonth;
  }).length;

  const monthlyGrowth = usersThisMonth === 0
    ? 0
    : usersLastMonth > 0
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100)
      : 100;

  // Plano mais vendido
  const planCounts = subscriptions
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
      <Card className="bg-gray-900 border-gray-700">
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

      <Card className="bg-gray-900 border-gray-700">
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

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Vendas Hoje</CardTitle>
          <Calendar className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {soldToday}
          </div>
          <p className="text-xs text-gray-400">
            planos vendidos hoje
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Vendas da Semana</CardTitle>
          <Calendar className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {soldThisWeek}
          </div>
          <p className="text-xs text-gray-400">
            planos vendidos esta semana
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Vendas do Mês</CardTitle>
          <Users className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {soldThisMonth}
          </div>
          <p className="text-xs text-gray-400">
            planos vendidos este mês
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
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