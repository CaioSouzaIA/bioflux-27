import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BackgroundAnimation } from "@/components/BackgroundAnimation";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Achievement {
  id: string;
  earned_at: string;
  badges: {
    id: string;
    name: string;
    description: string;
    image_url: string;
  };
}

export default function Achievements() {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar todas as badges disponíveis
  const { data: allBadges, isLoading: isBadgesLoading } = useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Buscar conquistas do usuário
  const { data: userAchievements, isLoading: isAchievementsLoading } = useQuery({
    queryKey: ["user-achievements"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_achievements")
        .select("badge_id, earned_at")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
  });

  const isLoading = isBadgesLoading || isAchievementsLoading;

  // Criar mapa de conquistas do usuário
  const achievementsMap = new Map(
    userAchievements?.map(a => [a.badge_id, a.earned_at]) || []
  );

  const getAvatarUrl = () => {
    if (profile?.avatar_url) {
      return profile.avatar_url;
    }
    return null;
  };

  const getUserInitials = () => {
    const firstName = profile?.first_name || "";
    const lastName = profile?.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

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
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-600 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <img 
                src="/lovable-uploads/47b13cc6-5100-44ec-a86b-17a57bac71c6.png" 
                alt="BIOFLUX.AI" 
                className="h-10"
              />
            </div>
          </div>

          {/* Header com perfil do usuário */}
          <Card className="mb-8 bg-gray-900/90 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-gray-700">
                  <AvatarImage src={getAvatarUrl() || undefined} />
                  <AvatarFallback className="text-lg bg-gray-800 text-white">
                    {getUserInitials() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {profile?.first_name} {profile?.last_name}
                  </h1>
                  <p className="text-gray-300">
                    {achievementsMap.size} conquistas desbloqueadas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de conquistas */}
          <div>
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">
              Conquistas ({achievementsMap.size} / {allBadges?.length || 0})
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse bg-gray-900/90 border-gray-700">
                  <div className="h-24 bg-gray-800 rounded mb-4" />
                  <div className="h-4 bg-gray-800 rounded mb-2" />
                  <div className="h-3 bg-gray-800 rounded" />
                </Card>
              ))}
            </div>
          ) : allBadges && allBadges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allBadges.map((badge) => {
                const earnedDate = achievementsMap.get(badge.id);
                const isEarned = !!earnedDate;
                
                return (
                  <Card 
                    key={badge.id} 
                    className={`p-6 backdrop-blur-sm transition-all ${
                      isEarned 
                        ? 'bg-gray-900/90 border-yellow-500/50 hover:bg-gray-800/70' 
                        : 'bg-gray-900/50 border-gray-700 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`mb-4 rounded-full p-4 border-2 ${
                        isEarned 
                          ? 'bg-yellow-500/10 border-yellow-500/30' 
                          : 'bg-gray-800/20 border-gray-700/30'
                      }`}>
                        <img
                          src={badge.image_url}
                          alt={badge.name}
                          className={`h-16 w-16 object-contain ${!isEarned && 'grayscale'}`}
                        />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-white">
                        {badge.name}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">
                        {badge.description}
                      </p>
                      {isEarned ? (
                        <div className="flex items-center gap-2 text-xs text-yellow-400">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Conquistado em{" "}
                            {format(new Date(earnedDate), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">
                          Conquista bloqueada
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center bg-gray-900/90 border-gray-700 backdrop-blur-sm">
              <Trophy className="h-12 w-12 text-yellow-500/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">
                Nenhuma conquista disponível
              </h3>
              <p className="text-gray-300">
                Aguarde novas conquistas serem adicionadas!
              </p>
            </Card>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
