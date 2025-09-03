
import React from 'react';
import ClientLogin from '@/components/ClientLogin';
import ClientDashboard from '@/components/ClientDashboard';
import PlanSelector from '@/components/PlanSelector';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';

const LoadingScreen = () => (
  <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
    <BackgroundAnimation />
    <div className="relative z-10 text-white text-xl">Carregando...</div>
  </div>
);

const ClientArea: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuthContext();
  const { data: subscriptions = [], isLoading: subscriptionLoading } = useSubscriptions();

  const handleSubscriptionCreated = () => {
    console.log('🎉 Assinatura criada, redirecionando para dashboard');
    
    const url = new URL(window.location.href);
    url.searchParams.delete('showPlanSelector');
    window.history.replaceState({}, '', url.toString());
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    console.log('🔐 Exibindo tela de login');
    return <ClientLogin />;
  }

  // A partir daqui, user existe. useSubscriptions é ativado.
  if (subscriptionLoading) {
    return <LoadingScreen />;
  }
  
  // Temos usuário e dados de assinatura (apenas para este usuário).
  const activeSubscription = subscriptions.find(sub => sub.status === 'ativo');
  const hasExpiredSubscription = subscriptions.some(sub => sub.status === 'expirado');
  
  // Verificar se há assinatura ativa que está vencida (0 dias restantes)
  const hasExpiredActiveSubscription = subscriptions.some(sub => {
    if (sub.status === 'ativo' && sub.expires_at) {
      const expiryDate = new Date(sub.expires_at);
      const today = new Date();
      const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 0;
    }
    return false;
  });

  const urlParams = new URLSearchParams(window.location.search);
  const forceShowPlanSelector = urlParams.get('showPlanSelector') === 'true';

  if (forceShowPlanSelector) {
    console.log('🔗 Forçando exibição do seletor via URL');
    return <PlanSelector onSubscriptionCreated={handleSubscriptionCreated} isUpgrade={!!activeSubscription} />;
  }
  
  // Se tem assinatura expirada ou ativa com 0 dias restantes, redirecionar para seletor
  if (hasExpiredSubscription || hasExpiredActiveSubscription) {
    console.log('⏰ Assinatura expirada ou com 0 dias restantes, exibindo seletor para renovação');
    return <PlanSelector onSubscriptionCreated={handleSubscriptionCreated} isUpgrade={true} />;
  }
  
  if (activeSubscription) {
    console.log('🏠 Exibindo dashboard do cliente');
    return <ClientDashboard onLogout={handleLogout} />;
  }

  console.log('📋 Exibindo seletor de planos');
  return <PlanSelector onSubscriptionCreated={handleSubscriptionCreated} isUpgrade={false} />;
};

export default ClientArea;
