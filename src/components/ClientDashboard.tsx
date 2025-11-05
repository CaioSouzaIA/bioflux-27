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
import { useWorkoutCheckins } from '@/hooks/useWorkoutCheckins';
import { BucketUserCorrelation } from '@/components/BucketUserCorrelation';
import MetabolicAssessment from '@/components/MetabolicAssessment';
import { TrainingPeriodization } from '@/components/TrainingPeriodization';
import OnboardingModal from '@/components/OnboardingModal';
import { useQuery } from '@tanstack/react-query';

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

  // Buscar todas as badges disponíveis
  const { data: allBadges = [] } = useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar conquistas do usuário
  const { data: userAchievements = [] } = useQuery({
    queryKey: ["user-achievements", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select("badge_id, earned_at")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
  });

  // Calcular total de conquistas desbloqueadas
  const achievementsMap = new Map(
    userAchievements.map(a => [a.badge_id, a.earned_at])
  );
  const earnedAchievementsCount = allBadges.filter(badge => {
    const earnedDate = achievementsMap.get(badge.id);
    const metadata = badge.metadata as { type?: string; days_required?: number } | null;
    const isAccountAgeBadge = metadata?.type === 'account_age';
    const daysRequired = metadata?.days_required || 0;
    const accountAgeDays = userProfile?.created_at
      ? Math.floor((new Date().getTime() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const isEarnedByTime = isAccountAgeBadge && accountAgeDays >= daysRequired;
    return !!earnedDate || isEarnedByTime;
  }).length;

  // Buscar check-ins de treino
  const { weeklyCheckins } = useWorkoutCheckins(user?.id);

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
                  className="bg-[#161616] border-white text-white hover:bg-gray-800 hover:text-white"
                >
                  ← Voltar
                </Button>
                <img 
                  src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
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
                src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
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
            {/* Prescrições Card */}
            <Card className="bg-[#161616] border-black backdrop-blur-sm flex flex-col h-full hover:bg-gray-900/50 transition-all">
              <CardContent className="flex flex-col items-center justify-between flex-1 p-6">
                <div className="flex flex-col items-center flex-1 w-full">
                  <div className="mb-4 mt-2">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-lg text-center mb-3">Prescrições</h3>
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-white mb-1">{totalPrescriptions}</div>
                    <div className="flex gap-3 text-xs justify-center">
                      <span className="text-green-400 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                        {dietPrescriptions.length} Dieta
                      </span>
                      <span className="text-orange-400 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                        {trainingPrescriptions.length} Treino
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  onClick={handlePrescriptionsAccess}
                >
                  Ver Prescrições
                </Button>
              </CardContent>
            </Card>

            {/* Conquistas Card */}
            <Card className="bg-[#161616] border-black backdrop-blur-sm flex flex-col h-full hover:bg-gray-900/50 transition-all">
              <CardContent className="flex flex-col items-center justify-between flex-1 p-6">
                <div className="flex flex-col items-center flex-1 w-full">
                  <div className="mb-4 mt-2">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h3 className="text-white font-semibold text-lg text-center mb-3">Conquistas</h3>
                  <div className="text-center mb-6 flex-1 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-yellow-500 mb-1">{earnedAchievementsCount}/{allBadges.length}</div>
                    <p className="text-gray-400 text-sm">Conquistas desbloqueadas</p>
                  </div>
                </div>
                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                  onClick={handleAchievementsAccess}
                >
                  Ver Conquistas
                </Button>
              </CardContent>
            </Card>

            {/* Formulários Card */}
            <Card className={`bg-[#161616] border-black backdrop-blur-sm flex flex-col h-full transition-all ${
              hasMetabolicAssessment
                ? 'hover:bg-gray-900/50'
                : 'opacity-60'
            }`}>
              <CardContent className="flex flex-col items-center justify-between flex-1 p-6">
                <div className="flex flex-col items-center flex-1 w-full">
                  <div className="mb-4 mt-2 relative">
                    <FileText className="w-10 h-10 text-purple-500" />
                    {!hasMetabolicAssessment && (
                      <Lock className="w-3 h-3 text-red-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-lg text-center mb-3">Formulários</h3>
                  <div className="text-center mb-6 flex-1 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-purple-500 mb-1">{formsCount}</div>
                    <p className="text-gray-400 text-sm">Formulários</p>
                  </div>
                </div>
                <Button
                  className={`w-full font-medium ${
                    hasMetabolicAssessment
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-600 cursor-not-allowed text-gray-400'
                  }`}
                  onClick={handleFormsAccess}
                  disabled={!hasMetabolicAssessment}
                >
                  {hasMetabolicAssessment ? 'Ver Formulários' : 'Bloqueado'}
                </Button>
              </CardContent>
            </Card>

            {/* Avaliação Metabólica Card */}
            <Card className="bg-[#161616] border-black backdrop-blur-sm flex flex-col h-full hover:bg-gray-900/50 transition-all">
              <CardContent className="flex flex-col items-center justify-between flex-1 p-6">
                <div className="flex flex-col items-center flex-1 w-full">
                  <div className="mb-4 mt-2">
                    <Calculator className="w-10 h-10 text-orange-500" />
                  </div>
                  <h3 className="text-white font-semibold text-lg text-center mb-3">Avaliação<br />metabólica</h3>
                  {hasMetabolicAssessment && (
                    <div className="mb-6 flex items-center gap-2 justify-center">
                      <Badge variant="outline" className="text-green-400 border-green-400 bg-green-400/10 text-xs">
                        Completa
                      </Badge>
                    </div>
                  )}
                  {!hasMetabolicAssessment && <div className="mb-6 flex-1"></div>}
                </div>
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium"
                  onClick={handleMetabolicAssessment}
                >
                  {hasMetabolicAssessment ? 'Ver/Atualizar TMB' : 'Calcular TMB'}
                </Button>
              </CardContent>
            </Card>

            {/* AI Coach - Bloqueado para plano Standard */}
            <Card className={`bg-[#161616] border-black backdrop-blur-sm flex flex-col h-full transition-all ${
              !hasStandardPlan
                ? 'hover:bg-gray-900/50'
                : 'opacity-60'
            }`}>
              <CardContent className="flex flex-col items-center justify-between flex-1 p-6">
                <div className="flex flex-col items-center flex-1 w-full">
                  <div className="mb-4 mt-2 relative">
                    <MessageCircle className="w-10 h-10 text-green-500" />
                    {hasStandardPlan && (
                      <Lock className="w-3 h-3 text-red-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-lg text-center mb-6">AI Coach</h3>
                  <div className="text-center mb-6 flex-1 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Tire dúvidas com seu AI coach</p>
                  </div>
                </div>
                <Button
                  className={`w-full font-medium ${
                    !hasStandardPlan
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 cursor-not-allowed text-gray-400'
                  }`}
                  onClick={handleWhatsAppRedirect}
                  disabled={hasStandardPlan}
                >
                  {!hasStandardPlan ? 'Chamar no WhatsApp' : 'Apenas no Plano Pro'}
                </Button>
              </CardContent>
            </Card>

            {/* Periodização de Treino - Bloqueado para plano Standard */}
            {hasTrainingSubscription && (
              <Card className={`bg-[#161616] border-black backdrop-blur-sm flex flex-col h-full transition-all ${
                !hasStandardPlan
                  ? 'hover:bg-gray-900/50'
                  : 'opacity-60'
              }`}>
                <CardContent className="flex flex-col items-center justify-between flex-1 p-6">
                  <div className="flex flex-col items-center flex-1 w-full">
                    <div className="mb-4 mt-2 relative">
                      <Activity className="w-10 h-10 text-red-500" />
                      {hasStandardPlan && (
                        <Lock className="w-3 h-3 text-red-500 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <h3 className="text-white font-semibold text-lg text-center mb-6">Periodização<br />de Treino</h3>
                    <div className="text-center mb-6 flex-1 flex items-center justify-center">
                      <p className="text-gray-400 text-sm">Veja os detalhes do seu treino</p>
                    </div>
                  </div>
                  <Button
                    className={`w-full font-medium ${
                      !hasStandardPlan
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-600 cursor-not-allowed text-gray-400'
                    }`}
                    onClick={handleTrainingPeriodization}
                    disabled={hasStandardPlan}
                  >
                    {!hasStandardPlan ? 'Ver Periodização' : 'Apenas no Plano Pro'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Check-in de Treino */}
            {hasTrainingSubscription && (
              <Card className="bg-[#161616] border-black backdrop-blur-sm flex flex-col h-full hover:bg-gray-900/50 transition-all">
                <CardContent className="flex flex-col items-center justify-between flex-1 p-6">
                  <div className="flex flex-col items-center flex-1 w-full">
                    <div className="mb-4 mt-2">
                      <Dumbbell className="w-10 h-10 text-cyan-500" />
                    </div>
                    <h3 className="text-white font-semibold text-lg text-center mb-6">Check-in<br />de Treino</h3>
                    <div className="text-center mb-6 flex-1 flex items-center justify-center">
                      <p className="text-gray-400 text-sm">Registre seus treinos</p>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium"
                    onClick={handleWorkoutCheckin}
                  >
                    Registrar Treino
                  </Button>
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
