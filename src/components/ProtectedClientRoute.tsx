
import { useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedClientRouteProps {
  children: React.ReactNode;
}

const ProtectedClientRoute = ({ children }: ProtectedClientRouteProps) => {
  const { user, userType, loading } = useAuthContext();

  // Debug logs para rota protegida do cliente
  useEffect(() => {
    console.log('🛡️ ProtectedClientRoute montada:', new Date().toISOString());
    
    return () => {
      console.log('💀 ProtectedClientRoute desmontada:', new Date().toISOString());
    };
  }, []);

  useEffect(() => {
    console.log('🔍 ProtectedClientRoute - Estado:', {
      user: user?.id || 'null',
      userType,
      loading,
      timestamp: new Date().toISOString()
    });
  }, [user, userType, loading]);

  if (loading || (user && userType === null)) {
    console.log('⏳ ProtectedClientRoute - Ainda carregando...');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ ProtectedClientRoute - Usuário não logado, redirecionando para /client');
    return <Navigate to="/client" replace />;
  }

  // Apenas clientes podem acessar essas rotas
  if (userType !== 'client') {
    console.log('🚫 ProtectedClientRoute - Usuário não é client, redirecionando para /admin');
    return <Navigate to="/admin" replace />;
  }

  console.log('✅ ProtectedClientRoute - Renderizando children');
  return <>{children}</>;
};

export default ProtectedClientRoute;
