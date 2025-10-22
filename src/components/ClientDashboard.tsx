import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { FileText, Dumbbell, UtensilsCrossed, Calendar, Calculator, Activity, Lock, Trophy } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import ClientDropdown from '@/components/ClientDropdown';
import { format, addMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useDietPrescriptions } from '@/hooks/useDietPrescriptions';
import { useTrainingPrescriptions } from '@/hooks/useTrainingPrescriptions';
import { useMetabolicAssessment } from '@/hooks/useMetabolicAssessment';
import { BucketUserCorrelation } from '@/components/BucketUserCorrelation';
import MetabolicAssessment from '@/components/MetabolicAssessment';
import { TrainingPeriodization } from '@/components/TrainingPeriodization';
import OnboardingModal from '@/components/OnboardingModal';

interface Subscription {
  id: string;
  plan_id: string;
  service_type: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  subscription_plans: {
    name: string;
    max_plans: number;
    price: number;
  };
}

interface ClientDashboardProps {
  onLogout: () => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ onLogout }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [formsCount, setFormsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'metabolic' | 'periodization'>('dashboard');
  const { user, userProfile } = useAuthContext();
  const navigate = useNavigate();
  
  // Buscar prescrições de dieta e treino do usuário atual
  const { data: dietPrescriptions = [], isLoading: dietLoading } = useDietPrescriptions(user?.id);
  const { data: trainingPrescriptions = [], isLoading: trainingLoading } = useTrainingPrescriptions(user?.id);
  
  const prescriptionsLoading = dietLoading || trainingLoading;
  const totalPrescriptions = dietPrescriptions.length + trainingPrescriptions.length;

  // Verificar se o usuário tem avaliação metabólica
  const { data: metabolicAssessment, isLoading: metabolicLoading } = useMetabolicAssessment(user?.id);
  const hasMetabolicAssessment = !!metabolicAssessment;

  // Verificar se o usuário tem assinatura de treino
  const hasTrainingSubscription = subscriptions.some(sub => 
    sub.service_type === 'treino' || sub.service_type === 'treino-dieta'
  );

  // Verificar se o usuário tem plano Standard (bloquear funcionalidades)
  const hasStandardPlan = subscriptions.some(sub => 
    sub.subscription_plans?.name?.includes('Standard')
  );


  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  useEffect(() => {
    if (subscriptions.length > 0) {
      fetchFormsCount();
    }
  }, [subscriptions]);

  const fetchSubscriptions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('client_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            max_plans,
            price
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'ativo');

      if (error) throw error;
      
      // Calculando data de expiração para cada assinatura (1 mês a partir da criação)
      const subscriptionsWithExpiration = (data || []).map(sub => {
        // Se não tiver expires_at, calcula como 1 mês após created_at
        const expiresAt = sub.expires_at || 
          addMonths(new Date(sub.created_at), 1).toISOString();
        return {
          ...sub,
          expires_at: expiresAt
        };
      });
      
      setSubscriptions(subscriptionsWithExpiration);
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas assinaturas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFormsCount = async () => {
    try {
      // Determinar quais categorias de formulários o cliente pode ver baseado em suas assinaturas
      const allowedCategories = ['feedback']; // Todos podem ver feedback
      
      subscriptions.forEach(subscription => {
        if (subscription.service_type === 'dieta' || subscription.service_type === 'treino-dieta') {
          allowedCategories.push('anamnese-dieta');
        }
        if (subscription.service_type === 'treino' || subscription.service_type === 'treino-dieta') {
          allowedCategories.push('anamnese-treino');
        }
      });

      // Buscar formulários criados por admins nas categorias permitidas
      const { data: adminProfiles, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'admin');

      if (adminError) throw adminError;

      const adminIds = adminProfiles?.map(profile => profile.id) || [];

      if (adminIds.length > 0) {
        const { data: forms, error: formsError } = await supabase
          .from('user_forms')
          .select('id')
          .in('user_id', adminIds)
          .in('category', allowedCategories);

        if (formsError) throw formsError;

        setFormsCount((forms || []).length);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de formulários:', error);
    }
  };

  const handleBucketUpdate = (userId: string, filePath: string) => {
    console.log('🔄 [DASHBOARD] Correlação de bucket detectada:', {
      userId,
      filePath,
      userMatch: userId === user?.id
    });
    
    // Verificar se a atualização é para o usuário atual
    if (userId === user?.id) {
      // Recarregar as prescrições quando houver correlação de bucket
      // A query será automaticamente invalidada pelo hook de monitoramento
    }
  };

  const handleWhatsAppRedirect = () => {
    if (hasStandardPlan) {
      toast({
        title: "Recurso Indisponível",
        description: "O AI Coach está disponível apenas no plano Pro. Faça upgrade para acessar este recurso.",
        variant: "destructive",
      });
      return;
    }
    window.open('https://wa.me/5581998095092', '_blank');
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'treino':
        return <Dumbbell className="w-5 h-5 text-orange-500" />;
      case 'dieta':
        return <UtensilsCrossed className="w-5 h-5 text-green-500" />;
      case 'treino-dieta':
        return <div className="flex gap-1">
          <Dumbbell className="w-4 h-4 text-orange-500" />
          <UtensilsCrossed className="w-4 h-4 text-green-500" />
        </div>;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getServiceLabel = (serviceType: string) => {
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
  
  const getSubscriptionExpiryDate = (createdAt: string) => {
    const subscriptionDate = new Date(createdAt);
    return addMonths(subscriptionDate, 12);
  };

  const getDaysUntilNextReset = (createdAt: string) => {
    const today = new Date();
    const subscriptionDate = new Date(createdAt);
    
    // Calcular o próximo dia do mês da assinatura
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const subscriptionDay = subscriptionDate.getDate();
    
    // Criar data para o dia da assinatura no mês atual
    let nextResetDate = new Date(currentYear, currentMonth, subscriptionDay);
    
    // Se já passou do dia da assinatura neste mês, vai para o próximo mês
    if (nextResetDate <= today) {
      nextResetDate = new Date(currentYear, currentMonth + 1, subscriptionDay);
    }
    
    return Math.max(0, differenceInDays(nextResetDate, today));
  };

  const handleFormsAccess = () => {
    if (!hasMetabolicAssessment) {
      toast({
        title: "Avaliação Metabólica Necessária",
        description: "Complete sua avaliação metabólica antes de acessar os formulários.",
        variant: "destructive",
      });
      return;
    }
    navigate('/client/forms');
  };

  const handlePrescriptionsAccess = () => {
    navigate('/client/prescriptions');
  };

  const handleAchievementsAccess = () => {
    navigate('/client/achievements');
  };

  const handleMetabolicAssessment = () => {
    setActiveView('metabolic');
  };

  const handleTrainingPeriodization = () => {
    if (hasStandardPlan) {
      toast({
        title: "Recurso Indisponível",
        description: "A Periodização de Treino está disponível apenas no plano Pro. Faça upgrade para acessar este recurso.",
        variant: "destructive",
      });
      return;
    }
    setActiveView('periodization');
  };

  const handleWorkoutCheckin = () => {
    navigate('/client/workout-checkin');
  };

  if (loading || prescriptionsLoading || metabolicLoading) {
    return (
      <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
        <BackgroundAnimation />
        <div className="relative z-10 text-white text-xl">Carregando...</div>
      </div>
    );
  }

  // Renderizar a avaliação metabólica se estiver ativa
  if (activeView === 'metabolic') {
    return (
      <div className="min-h-screen relative bg-black overflow-hidden">
        <BackgroundAnimation />
        <div className="relative z-10 min-h-screen p-4">
          <MetabolicAssessment onBack={() => setActiveView('dashboard')} />
        </div>
      </div>
    );
  }

  // Renderizar a periodização de treino se estiver ativa
  if (activeView === 'periodization') {
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
                  onClick={() => setActiveView('dashboard')}
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-600 hover:text-white"
                >
                  ← Voltar ao Dashboard
                </Button>
                <img 
                  src="/lovable-uploads/47b13cc6-5100-44ec-a86b-17a57bac71c6.png" 
                  alt="BIOFLUX.AI" 
                  className="h-10"
                />
              </div>
            </div>

            <TrainingPeriodization userId={user?.id || ''} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />
      
      {/* Componente de monitoramento de correlação bucket-usuário */}
      <BucketUserCorrelation onBucketUpdate={handleBucketUpdate} />
      
      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pt-8">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/47b13cc6-5100-44ec-a86b-17a57bac71c6.png" 
                alt="BIOFLUX.AI" 
                className="h-10"
              />
            </div>
            
            <ClientDropdown onLogout={onLogout} />
          </div>

          {/* Alerta se não tiver avaliação metabólica */}
          {!hasMetabolicAssessment && (
            <Card className="bg-orange-900/50 border-orange-500/50 backdrop-blur-sm mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calculator className="w-5 h-5 text-orange-400" />
                  <div>
                    <h3 className="text-orange-200 font-medium">Complete sua Avaliação Metabólica</h3>
                    <p className="text-orange-300 text-sm">
                      Você precisa completar sua avaliação metabólica antes de acessar os formulários.
                    </p>
                  </div>
                  <Button 
                    onClick={handleMetabolicAssessment}
                    className="bg-orange-600 hover:bg-orange-700"
                    size="sm"
                  >
                    Fazer Avaliação
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Assinaturas Ativas */}
          <div className="grid gap-6 mb-8">
            <Card className="bg-[#161616] border-black backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Suas Assinaturas</CardTitle>
                <CardDescription className="text-gray-300">
                  Planos ativos e serviços disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    Nenhuma assinatura ativa encontrada.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {subscriptions.map((subscription) => (
                      <div
                        key={subscription.id}
                        className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {getServiceIcon(subscription.service_type)}
                          <div>
                            <h3 className="text-white font-medium">
                              {subscription.subscription_plans?.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {getServiceLabel(subscription.service_type)}
                            </p>
                            
                            <div className="mt-1 flex items-center text-xs text-gray-400">
                              <Calendar className="w-3 h-3 mr-1" />
                              {userProfile?.updated_at ? (
                                <>Expira em: {format(addMonths(new Date(userProfile.updated_at), 1), 'dd/MM/yyyy', {locale: ptBR})}</>
                              ) : (
                                <>Sem data de ativação</>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className={
                              (userProfile?.activated || subscription.subscription_plans?.name?.includes('ilimitado'))
                                ? "text-green-400 border-green-400 bg-green-400/10" 
                                : "text-red-400 border-red-400 bg-red-400/10"
                            }
                          >
                            {(userProfile?.activated || subscription.subscription_plans?.name?.includes('ilimitado')) ? 'ativo' : 'inativo'}
                          </Badge>
                          <p className="text-gray-400 text-sm mt-1">
                            R$ {subscription.subscription_plans?.price?.toFixed(2)}/mês
                          </p>
                          {userProfile?.updated_at && (
                            <p className="text-xs text-orange-300 mt-1">
                              {Math.max(0, differenceInDays(addMonths(new Date(userProfile.updated_at), 1), new Date()))} dias restantes
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Seções Principais */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-[#161616] border-black backdrop-blur-sm hover:bg-[#1c1c1c] transition-all flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <FileText className="w-6 h-6 text-white" />
                  Prescrições
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Visualize suas prescrições de treino e dieta
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{totalPrescriptions}</div>
                    <p className="text-gray-400 text-sm">Prescrições disponíveis</p>
                    <div className="flex gap-4 mt-2 text-xs justify-center">
                      <span className="text-green-400">
                        <UtensilsCrossed className="w-3 h-3 inline mr-1" />
                        {dietPrescriptions.length} Dieta
                      </span>
                      <span className="text-orange-400">
                        <Dumbbell className="w-3 h-3 inline mr-1" />
                        {trainingPrescriptions.length} Treino
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handlePrescriptionsAccess}
                  >
                    Ver Prescrições
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#161616] border-black backdrop-blur-sm hover:bg-[#1c1c1c] transition-all flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Conquistas
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Veja suas conquistas e badges desbloqueados
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Desbloqueie conquistas</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button 
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                    onClick={handleAchievementsAccess}
                  >
                    Ver Conquistas
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-[#161616] border-black backdrop-blur-sm transition-all flex flex-col ${
              hasMetabolicAssessment 
                ? 'hover:bg-gray-800/70 cursor-pointer' 
                : 'opacity-60 cursor-not-allowed'
            }`}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="relative">
                    <FileText className="w-6 h-6 text-purple-500" />
                    {!hasMetabolicAssessment && (
                      <Lock className="w-3 h-3 text-red-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  Formulários
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Preencha formulários de avaliação e feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-500">{formsCount}</div>
                    <p className="text-gray-400 text-sm">Formulários disponíveis</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button 
                    className={`w-full ${
                      hasMetabolicAssessment 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                    onClick={handleFormsAccess}
                    disabled={!hasMetabolicAssessment}
                  >
                    {hasMetabolicAssessment ? 'Ver Formulários' : 'Bloqueado'}
                  </Button>
                </div>
                {!hasMetabolicAssessment && (
                  <p className="text-xs text-red-400 mt-2 text-center">
                    Complete a avaliação metabólica primeiro
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#161616] border-black backdrop-blur-sm hover:bg-[#1c1c1c] transition-all flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Calculator className="w-6 h-6 text-orange-500" />
                  Avaliação metabólica
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Calcule sua TMB e gasto energético total
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  {hasMetabolicAssessment && (
                    <div className="flex items-center gap-2 mb-2 justify-center">
                      <Badge variant="outline" className="text-green-400 border-green-400 bg-green-400/10">
                        Completa
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={handleMetabolicAssessment}
                  >
                    {hasMetabolicAssessment ? 'Ver/Atualizar TMB' : 'Calcular TMB'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Coach - Bloqueado para plano Standard */}
            <Card className={`bg-[#161616] border-black backdrop-blur-sm transition-all flex flex-col ${
              !hasStandardPlan 
                ? 'hover:bg-gray-800/70 cursor-pointer' 
                : 'opacity-60 cursor-not-allowed'
            }`}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="relative">
                    <MessageCircle className="w-6 h-6 text-green-500" />
                    {hasStandardPlan && (
                      <Lock className="w-3 h-3 text-red-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  AI Coach
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Tire dúvidas com seu AI coach
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Converse com seu assistente</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button 
                    className={`w-full ${
                      !hasStandardPlan 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                    onClick={handleWhatsAppRedirect}
                    disabled={hasStandardPlan}
                  >
                    {!hasStandardPlan ? 'Conversar no WhatsApp' : 'Apenas no Plano Pro'}
                  </Button>
                </div>
                {hasStandardPlan && (
                  <p className="text-xs text-red-400 mt-2 text-center">
                    Recurso disponível apenas no plano Pro
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Periodização de Treino - Bloqueado para plano Standard */}
            {hasTrainingSubscription && (
              <Card className={`bg-[#161616] border-black backdrop-blur-sm transition-all flex flex-col ${
                !hasStandardPlan 
                  ? 'hover:bg-gray-800/70 cursor-pointer' 
                  : 'opacity-60 cursor-not-allowed'
              }`}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="relative">
                      <Activity className="w-6 h-6 text-red-500" />
                      {hasStandardPlan && (
                        <Lock className="w-3 h-3 text-red-500 absolute -top-1 -right-1" />
                      )}
                    </div>
                    Periodização de Treino
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Veja os detalhes do seu treino atual
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-center mb-4">
                    <div className="text-center">
                      <Activity className="w-12 h-12 text-red-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Acompanhe sua periodização</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button 
                      className={`w-full ${
                        !hasStandardPlan 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-gray-600 cursor-not-allowed'
                      }`}
                      onClick={handleTrainingPeriodization}
                      disabled={hasStandardPlan}
                    >
                      {!hasStandardPlan ? 'Ver Periodização' : 'Apenas no Plano Pro'}
                    </Button>
                  </div>
                  {hasStandardPlan && (
                    <p className="text-xs text-red-400 mt-2 text-center">
                      Recurso disponível apenas no plano Pro
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Check-in de Treino */}
            {hasTrainingSubscription && (
              <Card className="bg-[#161616] border-black backdrop-blur-sm hover:bg-[#1c1c1c] transition-all flex flex-col">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <Dumbbell className="w-6 h-6 text-cyan-500" />
                    Check-in de Treino
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Registre seus treinos e acompanhe sua frequência
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-center mb-4">
                    <div className="text-center">
                      <Dumbbell className="w-12 h-12 text-cyan-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Registre seus treinos</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button 
                      className="w-full bg-cyan-600 hover:bg-cyan-700"
                      onClick={handleWorkoutCheckin}
                    >
                      Registrar Treino
                    </Button>
                  </div>
                </CardContent>
            </Card>
            )}
          </div>
        </div>
      </div>
      <OnboardingModal />
    </div>
  );
};

export default ClientDashboard;