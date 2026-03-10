
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthContext } from '@/contexts/AuthContext';
import { ChevronDown, User, LogOut, Key, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import PasswordReset from './PasswordReset';

const ProfileDropdown = () => {
  const { user, signOut, loading } = useAuthContext();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handlePasswordReset = () => {
    setShowPasswordReset(true);
  };

  // Buscar total de respostas de todos os formulários
  const { data: totalResponses = 0 } = useQuery({
    queryKey: ['total-responses'],
    queryFn: async () => {
      const { count } = await supabase
        .from('form_responses')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
    enabled: !!user,
  });

  if (!user) return null;

  if (showPasswordReset) {
    return <PasswordReset onBack={() => setShowPasswordReset(false)} />;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`min-w-[172px] justify-between border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] text-white shadow-lg shadow-black/30 hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)] hover:text-white ${open ? 'rounded-b-md rounded-t-2xl border-b-transparent' : 'rounded-2xl'}`}
        >
          <span className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Admin
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] translate-y-[-1px] rounded-b-2xl rounded-t-md border border-white/10 border-t-0 bg-[linear-gradient(180deg,rgba(18,18,22,0.98)_0%,rgba(8,8,11,0.98)_100%)] p-2 text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl" align="end" sideOffset={0}>
        <DropdownMenuLabel className="client-surface-subtle flex items-center space-x-3 rounded-2xl p-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-white/[0.06] text-white">
              {user.user_metadata?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-white font-medium">
              {user.user_metadata?.first_name || 'Usuário'}
            </span>
            <span className="text-gray-400 text-sm">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-2 bg-white/8" />
        
        <DropdownMenuItem 
          onClick={handlePasswordReset}
          className="rounded-xl px-3 py-2.5 text-white transition-colors hover:bg-white/6 focus:bg-white/6 hover:text-white focus:text-white"
        >
          <Key className="w-4 h-4 mr-2" />
          Trocar senha
        </DropdownMenuItem>
        
        <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-white transition-colors hover:bg-white/6 focus:bg-white/6 hover:text-white focus:text-white cursor-default">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-white" />
              <span>Planos automatizados</span>
            </div>
            <span className="text-white font-medium">{totalResponses}</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-2 bg-white/8" />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={loading}
          className="rounded-xl px-3 py-2.5 text-red-400 transition-colors hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300 focus:text-red-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
