
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
    <header className="w-full bg-black/80 backdrop-blur-sm border-b border-gray-800 p-4">
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
          className="bg-transparent border-gray-600 text-white hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  );
};

export default AuthHeader;
