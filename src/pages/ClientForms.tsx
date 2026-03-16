import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { toast } from '@/hooks/use-toast';
import { FileText, ArrowLeft, Lock } from 'lucide-react';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMetabolicAssessmentAgeInDays, isMetabolicAssessmentExpired, METABOLIC_ASSESSMENT_MAX_AGE_DAYS, useMetabolicAssessment } from '@/hooks/useMetabolicAssessment';
import { useDietPrescriptions } from '@/hooks/useDietPrescriptions';
import { useTrainingPrescriptions } from '@/hooks/useTrainingPrescriptions';
import {
  getFreePlanCategoryLabel,
  hasFreePlan as userHasFreePlan,
  hasUnlimitedPlan as userHasUnlimitedPlan,
  isFreePlanCategoryLocked,
} from '@/lib/subscriptionAccess';

interface Form {
  id: string;
  title: string;
  category: string;
  description?: string;
  user_id: string;
}

const ClientForms: React.FC = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const { data: subscriptions = [], isLoading: subscriptionLoading } = useSubscriptions();
  const { data: metabolicAssessment, isLoading: metabolicLoading } = useMetabolicAssessment(user?.id);
  const { data: dietPrescriptions = [], isLoading: dietPrescriptionsLoading } = useDietPrescriptions(user?.id);
  const { data: trainingPrescriptions = [], isLoading: trainingPrescriptionsLoading } = useTrainingPrescriptions(user?.id);
  const hasMetabolicAssessment = !!metabolicAssessment;
  const metabolicAssessmentExpired = isMetabolicAssessmentExpired(metabolicAssessment?.created_at);
  const metabolicAssessmentAgeInDays = getMetabolicAssessmentAgeInDays(metabolicAssessment?.created_at);
  const hasFreePlan = userHasFreePlan(subscriptions);
  const hasUnlimitedPlan = userHasUnlimitedPlan(subscriptions);
  const dietFreeLimitReached = dietPrescriptions.length >= 1;
  const trainingFreeLimitReached = trainingPrescriptions.length >= 1;

  // Verificar se o cliente já completou os formulários
  const activeSubscription = subscriptions.find(sub => sub.status === 'ativo');
  const formsCompleted = activeSubscription?.forms_completed || false;

  // Usar useQuery para melhor gerenciamento de estado
  const { data: forms = [], isLoading, error } = useQuery({
    queryKey: ['client-forms', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('Usuário não disponível');
      }

      console.log('Iniciando carregamento de formulários para cliente:', user.id);
      
      // Buscar assinaturas ativas do cliente
      const { data: subscriptions, error: subError } = await supabase
        .from('client_subscriptions')
        .select('service_type')
        .eq('user_id', user.id)
        .eq('status', 'ativo');

      if (subError) {
        console.error('Erro ao buscar assinaturas:', subError);
        throw subError;
      }

      console.log('Assinaturas encontradas:', subscriptions);

      // Determinar categorias permitidas
      const allowedCategories = ['feedback'];
      subscriptions?.forEach(sub => {
        if (sub.service_type === 'dieta' || sub.service_type === 'treino-dieta') {
          allowedCategories.push('anamnese-dieta');
        }
        if (sub.service_type === 'treino' || sub.service_type === 'treino-dieta') {
          allowedCategories.push('anamnese-treino');
        }
      });

      console.log('Categorias permitidas:', allowedCategories);

      // Buscar formulários de admins usando a função RPC
      const { data: adminIds, error: rpcError } = await supabase
        .rpc('get_admin_ids');

      if (rpcError) {
        console.error('Erro ao buscar IDs de admin via RPC:', rpcError);
        throw rpcError;
      }
      
      console.log('Admins encontrados:', adminIds?.length || 0);

      if (adminIds && adminIds.length > 0) {
        console.log('Buscando formulários dos admins:', adminIds);
        
        const { data: formsData, error: formsError } = await supabase
          .from('user_forms')
          .select('*')
          .in('user_id', adminIds)
          .in('category', allowedCategories);

        if (formsError) {
          console.error('Erro ao buscar formulários:', formsError);
          throw formsError;
        }

        console.log('Formulários encontrados:', formsData?.length || 0);
        return formsData || [];
      } else {
        console.log('Nenhum admin encontrado');
        return [];
      }
    },
    enabled: !!user && !subscriptionLoading,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true, // Recarregar quando a janela volta ao foco
    retry: 3,
  });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/client');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'anamnese-dieta':
        return 'Anamnese - Dieta';
      case 'anamnese-treino':
        return 'Anamnese - Treino';
      case 'feedback':
        return 'Feedback';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'anamnese-dieta':
        return 'bg-green-100 text-green-800';
      case 'anamnese-treino':
        return 'bg-orange-100 text-orange-800';
      case 'feedback':
        return 'bg-[#1f1f1f] text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const requiresMetabolicAssessment = (category: string) =>
    category === 'anamnese-dieta' || category === 'anamnese-treino';

  const isCategoryBlockedByFreePlan = (category: string) =>
    !hasUnlimitedPlan &&
    hasFreePlan &&
    isFreePlanCategoryLocked(category, dietPrescriptions.length, trainingPrescriptions.length);

  const handleFormAccess = (formId: string, category: string) => {
    if (requiresMetabolicAssessment(category) && (!hasMetabolicAssessment || metabolicAssessmentExpired)) {
      toast({
        title: 'Avaliação metabólica necessária',
        description: !hasMetabolicAssessment
          ? 'Você precisa completar sua avaliação metabólica antes de preencher um formulário.'
          : `Sua última avaliação metabólica foi feita há ${metabolicAssessmentAgeInDays} dias. Atualize-a para liberar novas prescrições.`,
        variant: 'destructive',
      });
      navigate('/client?view=metabolic');
      return;
    }

    if (isCategoryBlockedByFreePlan(category)) {
      toast({
        title: "Limite do plano Free atingido",
        description: `Você já utilizou sua geração de ${getFreePlanCategoryLabel(category)} no plano Free. Faça upgrade para gerar novamente.`,
        variant: "destructive",
      });
      return;
    }

    // Verificar se o usuário pode acessar formulários
    if (!hasFreePlan && !hasUnlimitedPlan && formsCompleted) {
      toast({
        title: "Formulários já preenchidos",
        description: "Você já preencheu os formulários neste período. Aguarde a renovação da sua assinatura para preencher novamente.",
        variant: "destructive",
      });
      return;
    }
    
    // Navegar para o formulário na mesma aba
    navigate(`/form/${formId}`);
  };

  // Se ainda está carregando e o usuário existe
  if ((isLoading || subscriptionLoading || metabolicLoading || dietPrescriptionsLoading || trainingPrescriptionsLoading) && user) {
    return (
      <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
        <BackgroundAnimation />
        <div className="relative z-10 text-white text-xl">Carregando formulários...</div>
      </div>
    );
  }

  // Se não há usuário logado
  if (!user) {
    return (
      <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
        <BackgroundAnimation />
        <div className="relative z-10 text-white text-xl">Redirecionando...</div>
      </div>
    );
  }

  // Se houve erro no carregamento
  if (error) {
    return (
      <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
        <BackgroundAnimation />
        <div className="relative z-10 text-center">
          <div className="text-red-400 text-xl mb-4">Erro ao carregar formulários</div>
          <Button 
            onClick={() => window.location.reload()} 
            className="client-action-button"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />
      
      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pt-8">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/client')}
                className="client-back-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <img 
                src="/lovable-uploads/47b13cc6-5100-44ec-a86b-17a57bac71c6.png" 
                alt="BIOFLUX.AI" 
                className="h-10"
              />
            </div>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Formulários Disponíveis</h1>
            <p className="text-gray-300">
              Preencha os formulários para nos ajudar a criar a melhor prescrição para você
            </p>
            {hasFreePlan && (
              <div className="client-surface-subtle mt-4 rounded-2xl border-cyan-500/20 bg-cyan-500/8 p-4">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Lock className="w-5 h-5" />
                  <span className="font-medium">Plano Free ativo</span>
                </div>
                <p className="mt-2 text-sm text-cyan-200">
                  Este plano é de teste: você pode gerar 1 dieta e 1 treino, uma única vez cada.
                </p>
                <p className="mt-2 text-xs text-cyan-100/80">
                  Dieta: {dietFreeLimitReached ? 'já utilizada' : 'disponível'} | Treino: {trainingFreeLimitReached ? 'já utilizado' : 'disponível'}
                </p>
              </div>
            )}
            {!hasFreePlan && !hasUnlimitedPlan && formsCompleted && (
              <div className="client-surface-subtle mt-4 rounded-2xl border-yellow-500/20 bg-yellow-500/8 p-4">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Lock className="w-5 h-5" />
                  <span className="font-medium">Formulários já preenchidos neste período</span>
                </div>
                <p className="text-yellow-300 text-sm mt-2">
                  Você já preencheu os formulários disponíveis. Aguarde a renovação da sua assinatura para preencher novamente.
                </p>
              </div>
            )}
            {hasMetabolicAssessment && metabolicAssessmentExpired && (
              <div className="client-surface-subtle mt-4 rounded-2xl border-amber-500/20 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2 text-amber-300">
                  <Lock className="h-5 w-5" />
                  <span className="font-medium">Avaliação metabólica expirada</span>
                </div>
                <p className="mt-2 text-sm text-amber-200">
                  Sua última avaliação foi feita há {metabolicAssessmentAgeInDays} dias. Após {METABOLIC_ASSESSMENT_MAX_AGE_DAYS} dias, é necessário atualizar na página de avaliação metabólica.
                </p>
                <Button
                  className="mt-3 bg-amber-500 text-black hover:bg-amber-400"
                  onClick={() => navigate('/client?view=metabolic')}
                >
                  Atualizar avaliação
                </Button>
              </div>
            )}
          </div>

          {/* Lista de Formulários */}
          <div className="grid gap-6">
            {forms.length === 0 ? (
              <Card className="client-surface-panel rounded-3xl">
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhum formulário disponível
                  </h3>
                  <p className="text-gray-400">
                    Não há formulários disponíveis para suas assinaturas ativas no momento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              forms.map((form) => (
                <Card key={form.id} className={`client-surface-panel rounded-3xl transition-all ${
                  (isCategoryBlockedByFreePlan(form.category) || (!hasFreePlan && !hasUnlimitedPlan && formsCompleted)) ? 'opacity-60' : 'hover:border-white/15'
                }`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white flex items-center gap-3">
                          {(isCategoryBlockedByFreePlan(form.category) || (!hasFreePlan && !hasUnlimitedPlan && formsCompleted))
                            ? <Lock className="w-5 h-5 text-yellow-400" />
                            : <FileText className="w-5 h-5" />}
                          {form.title}
                        </CardTitle>
                        {form.description && (
                          <CardDescription className="text-gray-300 mt-2">
                            {form.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge className={getCategoryColor(form.category)}>
                        {getCategoryLabel(form.category)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="client-action-button w-full"
                      onClick={() => handleFormAccess(form.id, form.category)}
                      disabled={
                        isCategoryBlockedByFreePlan(form.category) ||
                        (!hasFreePlan && !hasUnlimitedPlan && formsCompleted) ||
                        (requiresMetabolicAssessment(form.category) && (!hasMetabolicAssessment || metabolicAssessmentExpired))
                      }
                    >
                      {isCategoryBlockedByFreePlan(form.category)
                        ? `Limite de ${getFreePlanCategoryLabel(form.category)} atingido`
                        : !hasFreePlan && !hasUnlimitedPlan && formsCompleted
                        ? 'Formulário Bloqueado'
                        : requiresMetabolicAssessment(form.category) && (!hasMetabolicAssessment || metabolicAssessmentExpired)
                          ? 'Atualize sua avaliação metabólica'
                          : 'Preencher Formulário'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientForms;
