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
import { ChevronDown, LogOut, Key, LifeBuoy, RefreshCcw, User, X, Camera } from 'lucide-react';
import PasswordReset from './PasswordReset';
import { AvatarUpload } from './AvatarUpload';

interface ClientDropdownProps {
  onLogout: () => void;
}

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
}

const ClientDropdown: React.FC<ClientDropdownProps> = ({ onLogout }) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [open, setOpen] = useState(false);

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
        .select('first_name, last_name, email, whatsapp, avatar_url')
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

  const getDisplayWhatsApp = () => {
    return userProfile?.whatsapp || 'Nao informado';
  };

  if (showPasswordReset) {
    return <PasswordReset onBack={() => setShowPasswordReset(false)} />;
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`group min-w-[168px] justify-between border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] text-white font-medium shadow-lg shadow-black/30 hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)] hover:text-white ${
              open ? 'rounded-b-md rounded-t-2xl border-b-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.04)]' : 'rounded-2xl'
            }`}
          >
            <span className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Minha Conta
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={0}
          className="w-[var(--radix-dropdown-menu-trigger-width)] translate-y-[-1px] rounded-b-2xl rounded-t-md border border-white/10 border-t-0 bg-[linear-gradient(180deg,rgba(18,18,22,0.98)_0%,rgba(8,8,11,0.98)_100%)] p-2 text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <DropdownMenuLabel className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-3 text-gray-300">
            <div className="flex flex-col">
              <span className="text-white font-medium text-sm">
                {getDisplayName()}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-2 bg-white/8" />
          
          <DropdownMenuItem 
            onClick={() => setShowAvatarUpload(true)}
            className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-white transition-colors hover:bg-white/6 hover:text-white focus:bg-white/6 focus:text-white"
          >
            <Camera className="mr-2 h-4 w-4" />
            Meu perfil
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={handlePasswordReset}
            className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-white transition-colors hover:bg-white/6 hover:text-white focus:bg-white/6 focus:text-white"
          >
            <Key className="mr-2 h-4 w-4" />
            Trocar senha
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handlePlanChange}
            className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-white transition-colors hover:bg-white/6 hover:text-white focus:bg-white/6 focus:text-white"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Trocar plano
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={handleCancelSubscription}
            className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar assinatura
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleSupport}
            className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-white transition-colors hover:bg-white/6 hover:text-white focus:bg-white/6 focus:text-white"
          >
            <LifeBuoy className="mr-2 h-4 w-4" />
            Suporte
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="my-2 bg-white/8" />
          
          <DropdownMenuItem 
            onClick={onLogout}
            className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300"
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
        userWhatsapp={getDisplayWhatsApp()}
      />
    </>
  );
};

export default ClientDropdown;