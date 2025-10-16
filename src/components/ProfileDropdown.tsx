
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
import { User, LogOut, Key, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import PasswordReset from './PasswordReset';

const ProfileDropdown = () => {
  const { user, signOut, loading } = useAuthContext();
  const [showPasswordReset, setShowPasswordReset] = useState(false);

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500 transition-all duration-300"
        >
          <User className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-gray-900 border-gray-700" align="end">
        <DropdownMenuLabel className="flex items-center space-x-3 p-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gray-700 text-white">
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
        
        <DropdownMenuSeparator className="bg-gray-700" />
        
        <DropdownMenuItem 
          onClick={handlePasswordReset}
          className="text-white hover:bg-gray-800 focus:bg-gray-800 hover:text-white focus:text-white"
        >
          <Key className="w-4 h-4 mr-2" />
          Trocar senha
        </DropdownMenuItem>
        
        <DropdownMenuItem className="text-white hover:bg-gray-800 focus:bg-gray-800 hover:text-white focus:text-white cursor-default">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-white" />
              <span>Planos automatizados</span>
            </div>
            <span className="text-white font-medium">{totalResponses}</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-gray-700" />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={loading}
          className="text-red-400 hover:bg-gray-800 focus:bg-gray-800 hover:text-red-300 focus:text-red-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
