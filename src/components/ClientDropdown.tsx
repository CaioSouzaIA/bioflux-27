import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, Key, LifeBuoy, RefreshCcw, User, X, Camera } from 'lucide-react';
import PasswordReset from './PasswordReset';
import { AvatarUpload } from './AvatarUpload';


interface ClientDropdownProps {
  onLogout: () => void;
}

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const ClientDropdown: React.FC<ClientDropdownProps> = ({ onLogout }) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };
  
  const handlePasswordReset = () => {
    navigate('/change-password');
  };

  const handlePlanChange = () => {
    // Redirecionar para a página do seletor de planos
    window.location.href = '/client?showPlanSelector=true';
  };

  const handleCancelSubscription = () => {
    // Redirecionar para o link de cancelamento do Ticto
    window.open('https://help.ticto.com.br/pt-br/article/como-cancelar-minha-assinatura-szxtux/', '_blank');
  };

  const handleSupport = () => {
    window.open('mailto:suporte@bioflux.ai', '_blank');
  };

  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    return 'Usuário';
  };

  const getDisplayEmail = () => {
    return userProfile?.email || user?.email || '';
  };

  if (showPasswordReset) {
    return <PasswordReset onBack={() => setShowPasswordReset(false)} />;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-[#161616] border-gray-700 hover:bg-[#1c1c1c] hover:border-gray-600 text-white"
          >
            <User className="w-5 h-5 mr-2" />
            Minha Conta
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 bg-[#161616] border-gray-700 text-white">
          <DropdownMenuLabel className="text-gray-300 px-3 py-2">
            <div className="flex flex-col">
              <span className="text-white font-medium text-sm">
                {getDisplayName()}
              </span>
              <span className="text-gray-400 text-xs">
                {getDisplayEmail()}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />
          
          <DropdownMenuItem 
            onClick={() => setShowAvatarUpload(true)}
            className="text-white flex items-center bg-[#161616] hover:bg-[#1c1c1c] hover:text-white focus:bg-[#1c1c1c] focus:text-white cursor-pointer"
          >
            <Camera className="mr-2 h-4 w-4" />
            Foto de perfil
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={handlePasswordReset}
            className="text-white flex items-center bg-[#161616] hover:bg-[#1c1c1c] hover:text-white focus:bg-[#1c1c1c] focus:text-white cursor-pointer"
          >
            <Key className="mr-2 h-4 w-4" />
            Trocar senha
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handlePlanChange}
            className="text-white flex items-center bg-[#161616] hover:bg-[#1c1c1c] hover:text-white focus:bg-[#1c1c1c] focus:text-white cursor-pointer"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Trocar plano
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={handleCancelSubscription}
            className="text-red-400 flex items-center bg-[#161616] hover:bg-[#1c1c1c] hover:text-red-300 focus:bg-[#1c1c1c] focus:text-red-300 cursor-pointer"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar assinatura
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleSupport}
            className="text-white flex items-center bg-[#161616] hover:bg-[#1c1c1c] hover:text-white focus:bg-[#1c1c1c] focus:text-white cursor-pointer"
          >
            <LifeBuoy className="mr-2 h-4 w-4" />
            Suporte
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-gray-700" />
          
          <DropdownMenuItem 
            onClick={onLogout}
            className="text-red-400 flex items-center bg-[#161616] hover:bg-[#1c1c1c] hover:text-red-300 focus:bg-[#1c1c1c] focus:text-red-300 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AvatarUpload
        open={showAvatarUpload}
        onOpenChange={setShowAvatarUpload}
        currentAvatarUrl={userProfile?.avatar_url}
        userName={getDisplayName()}
      />
    </>
  );
};

export default ClientDropdown;