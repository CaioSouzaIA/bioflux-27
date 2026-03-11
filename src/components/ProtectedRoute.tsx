
import { useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, userType, loading } = useAuthContext();

  // Debug logs para rota protegida
  useEffect(() => {
    console.log('🔐 ProtectedRoute montada:', new Date().toISOString());
    
    return () => {
      console.log('💀 ProtectedRoute desmontada:', new Date().toISOString());
    };
  }, []);

  useEffect(() => {
    console.log('🔍 ProtectedRoute - Estado:', {
      user: user?.id || 'null',
      userType,
      loading,
      timestamp: new Date().toISOString()
    });
  }, [user, userType, loading]);

  if (loading || (user && userType === null)) {
    console.log('⏳ ProtectedRoute - Ainda carregando...');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ ProtectedRoute - Usuário não encontrado, redirecionando para /admin');
    return <Navigate to="/admin" replace />;
  }

  // Apenas admins podem acessar rotas protegidas
  if (userType !== 'admin') {
    console.log('🚫 ProtectedRoute - Usuário não é admin, redirecionando para /client');
    return <Navigate to="/client" replace />;
  }

  console.log('✅ ProtectedRoute - Renderizando children');
  return <>{children}</>;
};

export default ProtectedRoute;
