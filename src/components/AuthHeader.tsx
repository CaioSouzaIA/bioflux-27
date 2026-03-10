
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

const AuthHeader = () => {
  const { user, signOut, loading } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  return (
    <header className="w-full border-b border-white/8 bg-black/72 p-4 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <User className="w-6 h-6 text-white" />
          <span className="text-white font-medium">
            Olá, {user.user_metadata?.first_name || user.email}
          </span>
        </div>
        
        <Button
          onClick={handleSignOut}
          disabled={loading}
          variant="outline"
          size="sm"
          className="client-back-button bg-transparent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  );
};

export default AuthHeader;
