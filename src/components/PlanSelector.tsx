import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Star } from 'lucide-react';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';

interface Plan {
  id: string;
  name: string;
  max_plans: number;
  price: number;
}

interface PlanSelectorProps {
  onSubscriptionCreated: () => void;
  isUpgrade?: boolean;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ onSubscriptionCreated, isUpgrade = false }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const { user } = useAuthContext();
  const { data: subscriptions = [], isLoading: subscriptionLoading } = useSubscriptions();
  
  // Find active subscription for current user
  const activeSubscription = subscriptions.find(sub => sub.status === 'ativo');

  // Mapeamento dos planos para os links do Ticto (sem o plano ilimitado)
  const tictoLinks: Record<string, string> = {
    'Standard - Dieta': 'https://payment.ticto.app/OECA222B6',
    'Standard - Treino': 'https://payment.ticto.app/O99411F06',
    'Standard - Treino + Dieta': 'https://payment.ticto.app/OE6A7A03E',
    'Pro - Treino': 'https://payment.ticto.app/OE894EA7A',
    'Pro - Dieta': 'https://payment.ticto.app/O32EADB9A',
    'Pro - Treino + Dieta': 'https://payment.ticto.app/OADFD92E1',
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .neq('name', 'Plano Ilimitado') // Excluir plano ilimitado para clientes
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos.",
        variant: "destructive",
      });
    }
  };

  const createSubscription = async ({ planId, serviceType }: { planId: string; serviceType: string }) => {
    if (!user) return;

    try {
      // Calcular data de expiração de 30 dias
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias

      const { error } = await supabase
        .from('client_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          service_type: serviceType,
          status: 'ativo',
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Assinatura criada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      throw error;
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !user) {
      toast({
        title: "Atenção",
        description: "Selecione um plano antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) return;

    console.log('🔄 Processando assinatura do plano:', selectedPlanData.name);

    try {
      // Como o plano ilimitado não aparece mais na lista, esta lógica foi removida
      // Apenas admins podem habilitar planos ilimitados através da área administrativa

      // Para outros planos, verificar se existe link do Ticto
      const tictoLink = tictoLinks[selectedPlanData.name];
      
      if (tictoLink) {
        // Redirecionar para o Ticto
        window.location.href = tictoLink;
      } else {
        toast({
          title: "Plano em desenvolvimento",
          description: "Este plano estará disponível em breve. Entre em contato conosco para mais informações.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao processar assinatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a assinatura. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleBackToDashboard = () => {
    window.location.href = '/client';
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  // Função para obter o ícone do plano
  const getPlanIcon = (planName: string) => {
    if (planName.includes('Standard')) return <Star className="w-4 h-4 text-gray-400" />;
    if (planName.includes('Pro')) return <Star className="w-4 h-4 text-yellow-400" />;
    return '';
  };

  // Função para formatar o preço mensal
  const formatMonthlyPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}/mensal`;
  };

  // Função para obter o nome da categoria com (mensal)
  const getCategoryDisplayName = (category: string) => {
    if (category === 'Standard' || category === 'Pro') {
      return `${category} (mensal)`;
    }
    return category;
  };

  // Agrupar planos por categoria (Standard, Pro, Ilimitado)
  const groupedPlans = plans.reduce((acc, plan) => {
    const category = plan.name.split(' - ')[0]; // Standard, Pro, Ilimitado
    if (!acc[category]) acc[category] = [];
    acc[category].push(plan);
    return acc;
  }, {} as Record<string, Plan[]>);

  // Verificar se o plano selecionado tem link do Ticto
  const selectedPlanHasLink = selectedPlanData ? tictoLinks[selectedPlanData.name] : false;

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-800/90 border-gray-700">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={handleBackToDashboard}
                variant="outline"
                className="client-back-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
            
            {/* Mostrar plano atual se existir */}
            {activeSubscription && (
              <div className="mb-4 p-3 bg-[#1f1f1f] rounded-lg">
                <p className="text-white text-sm">
                  Plano atual: <strong>{activeSubscription.subscription_plans?.name}</strong>
                </p>
                <p className="text-white/80 text-xs">
                  {isUpgrade ? 'Selecione um novo plano para substituir o atual' : 'Você já possui um plano ativo'}
                </p>
              </div>
            )}
            
            <CardTitle className="text-2xl text-white">
              {isUpgrade || activeSubscription ? 'Trocar Plano' : 'Escolha seu Plano'}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {isUpgrade || activeSubscription
                ? 'Selecione um novo plano para substituir sua assinatura atual'
                : 'Selecione o plano ideal para suas necessidades'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-gray-300 font-medium">Selecione o Plano</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Escolha um plano" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {Object.entries(groupedPlans).map(([category, categoryPlans]) => (
                    <div key={category}>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase flex items-center gap-2">
                        {category.includes('Standard') && <Star className="w-3 h-3 text-gray-400" />}
                        {category.includes('Pro') && <Star className="w-3 h-3 text-yellow-400" />}
                        {getCategoryDisplayName(category)}
                      </div>
                      {categoryPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id} className="text-white">
                          <div className="flex flex-col items-start w-full">
                            <div className="font-medium text-sm sm:text-base">
                              {plan.name.replace(category + ' - ', '')}
                            </div>
                            <div className="text-sm font-bold text-green-400 mt-1">
                              {formatMonthlyPrice(plan.price)}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlanData && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center justify-center gap-2">
                    {getPlanIcon(selectedPlanData.name)} {selectedPlanData.name}
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    <span className="text-green-400">{formatMonthlyPrice(selectedPlanData.price)}</span>
                    <span className="text-sm text-gray-400 block mt-1">(Pagamento mensal)</span>
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleSubscribe}
              disabled={!selectedPlan || subscriptionLoading}
              className="w-full bg-[#1f1f1f] hover:bg-[#292929] text-white font-medium"
            >
              {subscriptionLoading ? 'Processando...' : 
               (activeSubscription ? 'Trocar Plano no Ticto' : 'Assinar no Ticto')}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Você será redirecionado para o Ticto para finalizar a assinatura
              {activeSubscription && (
                <><br />Seu plano atual será automaticamente cancelado ao confirmar o novo plano.</>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlanSelector;
