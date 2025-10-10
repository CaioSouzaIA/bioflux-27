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

  const { data: achievements, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          id,
          earned_at,
          badges (
            id,
            name,
            description,
            image_url
          )
        `)
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    },
  });

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
      
      <div className="relative z-10 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button
              onClick={() => navigate('/client')}
              variant="outline"
              className="bg-gray-900/90 border-gray-700 text-white hover:bg-gray-800/70"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
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
                    {achievements?.length || 0} conquistas desbloqueadas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de conquistas */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-white">Suas Conquistas</h2>
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
            ) : achievements && achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className="p-6 bg-gray-900/90 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 rounded-full bg-yellow-500/10 p-4 border-2 border-yellow-500/30">
                        <img
                          src={achievement.badges.image_url}
                          alt={achievement.badges.name}
                          className="h-16 w-16 object-contain"
                        />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-white">
                        {achievement.badges.name}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">
                        {achievement.badges.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Conquistado em{" "}
                          {format(new Date(achievement.earned_at), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center bg-gray-900/90 border-gray-700 backdrop-blur-sm">
                <Trophy className="h-12 w-12 text-yellow-500/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">
                  Nenhuma conquista ainda
                </h3>
                <p className="text-gray-300">
                  Continue usando a plataforma para desbloquear conquistas!
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
