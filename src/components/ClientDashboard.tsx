import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ShineBorder } from '@/components/ui/shine-border';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, FileText, Dumbbell, UtensilsCrossed, Calendar, Calculator, Activity, Lock, Target, Trophy } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import ClientDropdown from '@/components/ClientDropdown';
import { format, addMonths, differenceInDays, endOfMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useDietPrescriptions } from '@/hooks/useDietPrescriptions';
import { useTrainingPrescriptions } from '@/hooks/useTrainingPrescriptions';
import { useMetabolicAssessment } from '@/hooks/useMetabolicAssessment';
import { BucketUserCorrelation } from '@/components/BucketUserCorrelation';
import MetabolicAssessment from '@/components/MetabolicAssessment';
import { TrainingPeriodization } from '@/components/TrainingPeriodization';
import OnboardingModal from '@/components/OnboardingModal';
import { useMutation, useQuery } from '@tanstack/react-query';

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
  const [badgePickerOpen, setBadgePickerOpen] = useState(false);
  const [badgeShineColor, setBadgeShineColor] = useState<string>('rgba(255,255,255,0.92)');
  const { user, userProfile, refreshUserType } = useAuthContext();
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

  const { data: monthlyCheckins = [] } = useQuery({
    queryKey: ["monthly-workout-checkins", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();

      const { data, error } = await (supabase as any)
        .from("workout_checkins")
        .select("id, workout_date")
        .eq("user_id", user.id)
        .gte("workout_date", monthStart)
        .lte("workout_date", monthEnd);

      if (error) throw error;
      return data || [];
    },
  });

  const selectBadgeMutation = useMutation({
    mutationFn: async (badgeId: string | null) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({ selected_badge_id: badgeId })
        .eq("id", user.id);

      if (error) throw error;
      return badgeId;
    },
    onSuccess: async (badgeId) => {
      await refreshUserType();
      setBadgePickerOpen(false);
      toast({
        title: "Insígnia atualizada",
        description: badgeId ? "Sua insígnia exibida foi alterada." : "A insígnia exibida foi removida.",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar insígnia:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar sua insígnia agora.",
        variant: "destructive",
      });
    },
  });

  // Calcular total de conquistas desbloqueadas
  const achievementsMap = new Map(
    userAchievements.map(a => [a.badge_id, a.earned_at])
  );
  const accountAgeDays = userProfile?.created_at
    ? Math.floor((new Date().getTime() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const monthlyCheckinsCount = monthlyCheckins.length;
  const earnedBadges = allBadges.filter(badge => {
    const earnedDate = achievementsMap.get(badge.id);
    const metadata = badge.metadata as { type?: string; days_required?: number; monthly_checkins_required?: number } | null;
    const isAccountAgeBadge = metadata?.type === 'account_age';
    const daysRequired = metadata?.days_required || 0;
    const isEarnedByTime = isAccountAgeBadge && accountAgeDays >= daysRequired;
    const isWorkoutCheckinBadge = metadata?.type === 'workout_checkins';
    const checkinsRequired = metadata?.monthly_checkins_required || 0;
    const isEarnedByCheckins = isWorkoutCheckinBadge && monthlyCheckinsCount >= checkinsRequired;
    return !!earnedDate || isEarnedByTime || isEarnedByCheckins;
  });
  const earnedAchievementsCount = earnedBadges.length;
  const selectedBadge = earnedBadges.find((badge) => badge.id === userProfile?.selected_badge_id) || null;

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

  useEffect(() => {
    let isCancelled = false;

    if (!selectedBadge?.image_url) {
      setBadgeShineColor('rgba(255,255,255,0.92)');
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      if (isCancelled) return;

      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context) {
          setBadgeShineColor('rgba(255,255,255,0.92)');
          return;
        }

        canvas.width = 24;
        canvas.height = 24;
        context.drawImage(image, 0, 0, 24, 24);

        const { data } = context.getImageData(0, 0, 24, 24);
        let red = 0;
        let green = 0;
        let blue = 0;
        let weightTotal = 0;

        for (let index = 0; index < data.length; index += 4) {
          const alpha = data[index + 3] / 255;
          if (alpha < 0.2) continue;

          const pixelRed = data[index];
          const pixelGreen = data[index + 1];
          const pixelBlue = data[index + 2];
          const brightness = (pixelRed + pixelGreen + pixelBlue) / 3;
          const saturation = Math.max(pixelRed, pixelGreen, pixelBlue) - Math.min(pixelRed, pixelGreen, pixelBlue);
          const weight = Math.max(0.35, (saturation / 255) * 1.4 + (brightness / 255) * 0.15) * alpha;

          red += pixelRed * weight;
          green += pixelGreen * weight;
          blue += pixelBlue * weight;
          weightTotal += weight;
        }

        if (!weightTotal) {
          setBadgeShineColor('rgba(255,255,255,0.92)');
          return;
        }

        const dominantRed = Math.min(255, Math.round((red / weightTotal) * 1.12));
        const dominantGreen = Math.min(255, Math.round((green / weightTotal) * 1.12));
        const dominantBlue = Math.min(255, Math.round((blue / weightTotal) * 1.12));

        setBadgeShineColor(`rgba(${dominantRed}, ${dominantGreen}, ${dominantBlue}, 0.95)`);
      } catch (error) {
        console.error('Erro ao calcular cor da insígnia:', error);
        setBadgeShineColor('rgba(255,255,255,0.92)');
      }
    };

    image.onerror = () => {
      if (!isCancelled) {
        setBadgeShineColor('rgba(255,255,255,0.92)');
      }
    };

    image.src = selectedBadge.image_url;

    return () => {
      isCancelled = true;
    };
  }, [selectedBadge?.image_url]);

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

  const getBadgeFallback = (badgeName?: string | null) => {
    if (!badgeName) return "BI";
    return badgeName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    const metadataFirstName = user?.user_metadata?.first_name as string | undefined;
    const metadataLastName = user?.user_metadata?.last_name as string | undefined;
    if (metadataFirstName && metadataLastName) {
      return `${metadataFirstName} ${metadataLastName}`;
    }
    if (metadataFirstName) {
      return metadataFirstName;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Usuário";
  };

  const getUserInitials = () => {
    const first = userProfile?.first_name?.trim()?.[0] || (user?.user_metadata?.first_name as string | undefined)?.trim()?.[0] || "";
    const last = userProfile?.last_name?.trim()?.[0] || (user?.user_metadata?.last_name as string | undefined)?.trim()?.[0] || "";
    const initials = `${first}${last}`.trim();

    if (initials) {
      return initials.toUpperCase();
    }

    if (user?.email?.[0]) {
      return user.email[0].toUpperCase();
    }

    return "U";
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
                  className="client-back-button"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
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
            <Card className="client-glass-card" style={{ ['--card-glow' as string]: 'rgba(255,255,255,0.14)' }}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-12 w-12 border border-white/10">
                    <AvatarImage src={userProfile?.avatar_url || undefined} alt={getDisplayName()} />
                    <AvatarFallback className="bg-white/[0.06] text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-white">{getDisplayName()}</CardTitle>
                  </div>
                </div>
                <Popover open={badgePickerOpen} onOpenChange={setBadgePickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.04] transition-colors hover:bg-white/[0.08]"
                      aria-label="Escolher insígnia exibida"
                    >
                      <ShineBorder
                        borderWidth={2}
                        duration={7}
                        shineColor={[badgeShineColor, 'rgba(255,255,255,0.10)', badgeShineColor]}
                        className="rounded-full"
                      />
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={selectedBadge?.image_url || undefined}
                          alt={selectedBadge?.name || "Insígnia"}
                          className="scale-[1.3] object-cover"
                        />
                        <AvatarFallback className="bg-white/[0.06] text-xs font-semibold text-white">
                          {selectedBadge ? getBadgeFallback(selectedBadge.name) : <Trophy className="h-4 w-4 text-yellow-400" />}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[320px] rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,22,0.98)_0%,rgba(8,8,11,0.98)_100%)] p-3 text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-white">Insígnia exibida</h4>
                      <p className="text-xs text-gray-400">Escolha qual insígnia aparecerá no seu card de assinaturas.</p>
                    </div>
                    {earnedBadges.length === 0 ? (
                      <div className="client-surface-subtle rounded-2xl px-3 py-4 text-center text-sm text-gray-400">
                        Você ainda não desbloqueou nenhuma insígnia.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => selectBadgeMutation.mutate(null)}
                          className={`client-surface-subtle flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors ${!selectedBadge ? 'border-white/20 bg-white/[0.06]' : ''}`}
                          disabled={selectBadgeMutation.isPending}
                        >
                          <span className="text-sm text-white">Não exibir insígnia</span>
                          {!selectedBadge && <Check className="h-4 w-4 text-green-400" />}
                        </button>
                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                          {earnedBadges.map((badge) => {
                            const isSelected = selectedBadge?.id === badge.id;
                            return (
                              <button
                                key={badge.id}
                                type="button"
                                onClick={() => selectBadgeMutation.mutate(badge.id)}
                                className={`client-surface-subtle flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors ${isSelected ? 'border-white/20 bg-white/[0.06]' : ''}`}
                                disabled={selectBadgeMutation.isPending}
                              >
                                <span className="flex min-w-0 items-center gap-3">
                                  <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarImage src={badge.image_url || undefined} alt={badge.name} />
                                    <AvatarFallback className="bg-white/[0.06] text-xs font-semibold text-white">
                                      {getBadgeFallback(badge.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-white">{badge.name}</span>
                                    <span className="block truncate text-xs text-gray-400">{badge.description}</span>
                                  </span>
                                </span>
                                {isSelected && <Check className="h-4 w-4 shrink-0 text-green-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
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
                        className="client-surface-subtle flex items-center justify-between rounded-2xl bg-black p-4"
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
            <Card className="client-glass-card flex flex-col h-full transition-all" style={{ ['--card-glow' as string]: 'rgba(255,255,255,0.18)' }}>
              <CardContent className="client-card-body flex flex-col items-center justify-between flex-1 p-6">
                <div className="client-card-top flex flex-col items-center flex-1 w-full">
                  <div className="mb-4 mt-2">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="client-card-title text-white font-semibold text-lg text-center mb-3">Prescrições</h3>
                  <div className="client-card-copy text-center mb-6">
                    <div className="client-card-metric text-3xl font-bold text-white mb-1">{totalPrescriptions}</div>
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
                  className="w-full border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] text-white font-medium shadow-lg shadow-black/30 hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)]"
                  onClick={handlePrescriptionsAccess}
                >
                  Ver Prescrições
                </Button>
              </CardContent>
            </Card>

            {/* Conquistas Card */}
            <Card className="client-glass-card flex flex-col h-full transition-all" style={{ ['--card-glow' as string]: 'rgba(234,179,8,0.30)' }}>
              <CardContent className="client-card-body flex flex-col items-center justify-between flex-1 p-6">
                <div className="client-card-top flex flex-col items-center flex-1 w-full">
                  <div className="mb-4 mt-2">
                    <Trophy className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h3 className="client-card-title text-white font-semibold text-lg text-center mb-3">Conquistas</h3>
                  <div className="client-card-copy text-center mb-6 flex-1 flex flex-col items-center justify-center">
                    <div className="client-card-metric text-3xl font-bold text-yellow-500 mb-1">{earnedAchievementsCount}/{allBadges.length}</div>
                    <p className="text-gray-400 text-sm">Conquistas desbloqueadas</p>
                  </div>
                </div>
                <Button
                  className="w-full border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] text-white font-medium shadow-lg shadow-black/30 hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)]"
                  onClick={handleAchievementsAccess}
                >
                  Ver Conquistas
                </Button>
              </CardContent>
            </Card>

            {/* Formulários Card */}
            <Card className="client-glass-card flex flex-col h-full transition-all" style={{ ['--card-glow' as string]: 'rgba(168,85,247,0.30)' }}>
              <CardContent className="client-card-body flex flex-col items-center justify-between flex-1 p-6">
                <div className="client-card-top flex flex-col items-center flex-1 w-full">
                  <div className="mb-4 mt-2 relative">
                    <FileText className="w-10 h-10 text-purple-500" />
                    {!hasMetabolicAssessment && (
                      <Lock className="w-3 h-3 text-red-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <h3 className="client-card-title text-white font-semibold text-lg text-center mb-3">Formulários</h3>
                  <div className="client-card-copy text-center mb-6 flex-1 flex flex-col items-center justify-center">
                    <div className="client-card-metric text-3xl font-bold text-purple-500 mb-1">{formsCount}</div>
                    <p className="text-gray-400 text-sm">Formulários</p>
                  </div>
                </div>
                <Button
                  className={`w-full font-medium ${
                    hasMetabolicAssessment
                      ? 'border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] text-white shadow-lg shadow-black/30 hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)]'
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
            <Card className="client-glass-card flex flex-col h-full transition-all" style={{ ['--card-glow' as string]: 'rgba(249,115,22,0.30)' }}>
              <CardContent className="client-card-body flex flex-col items-center justify-between flex-1 p-6">
                <div className="client-card-top flex flex-col items-center flex-1 w-full">
                  <div className="mb-4 mt-2">
                    <Calculator className="w-10 h-10 text-orange-500" />
                  </div>
                  <h3 className="client-card-title text-white font-semibold text-lg text-center mb-3">Avaliação<br />metabólica</h3>
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
                  className="w-full border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] text-white font-medium shadow-lg shadow-black/30 hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)]"
                  onClick={handleMetabolicAssessment}
                >
                  {hasMetabolicAssessment ? 'Ver/Atualizar TMB' : 'Calcular TMB'}
                </Button>
              </CardContent>
            </Card>

            {/* AI Coach - Bloqueado para plano Standard */}
            <Card className="client-glass-card flex flex-col h-full transition-all" style={{ ['--card-glow' as string]: 'rgba(34,197,94,0.30)' }}>
              <CardContent className="client-card-body flex flex-col items-center justify-between flex-1 p-6">
                <div className="client-card-top flex flex-col items-center flex-1 w-full">
                  <div className="mb-4 mt-2 relative">
                    <MessageCircle className="w-10 h-10 text-green-500" />
                    {hasStandardPlan && (
                      <Lock className="w-3 h-3 text-red-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <h3 className="client-card-title text-white font-semibold text-lg text-center mb-6">AI Coach</h3>
                  <div className="client-card-copy text-center mb-6 flex-1 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Tire dúvidas com seu AI coach</p>
                  </div>
                </div>
                <Button
                  className={`w-full font-medium ${
                    !hasStandardPlan
                      ? 'border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] text-white shadow-lg shadow-black/30 hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)]'
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
              <Card className="client-glass-card flex flex-col h-full transition-all" style={{ ['--card-glow' as string]: 'rgba(239,68,68,0.30)' }}>
                <CardContent className="client-card-body flex flex-col items-center justify-between flex-1 p-6">
                  <div className="client-card-top flex flex-col items-center flex-1 w-full">
                    <div className="mb-4 mt-2 relative">
                      <Activity className="w-10 h-10 text-red-500" />
                      {hasStandardPlan && (
                        <Lock className="w-3 h-3 text-red-500 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <h3 className="client-card-title text-white font-semibold text-lg text-center mb-6">Periodização<br />de Treino</h3>
                    <div className="client-card-copy text-center mb-6 flex-1 flex items-center justify-center">
                      <p className="text-gray-400 text-sm">Veja os detalhes do seu treino</p>
                    </div>
                  </div>
                  <Button
                    className={`w-full font-medium ${
                      !hasStandardPlan
                        ? 'border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] text-white shadow-lg shadow-black/30 hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)]'
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

          </div>
        </div>
      </div>
      <OnboardingModal />
    </div>
  );
};

export default ClientDashboard;
