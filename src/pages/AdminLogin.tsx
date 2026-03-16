import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { SignInCard } from "@/components/ui/sign-in-card-2";
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import ForgotPasswordCard from '@/components/ForgotPasswordCard';

const AdminLogin = () => {
  const { user, userType, signIn, loading, sendPasswordResetEmail } = useAuthContext();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Debug logs para AdminLogin
  useEffect(() => {
    console.log('🔐 AdminLogin montado:', new Date().toISOString());
    
    return () => {
      console.log('💀 AdminLogin desmontado:', new Date().toISOString());
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    console.log('🚀 Tentativa de login iniciada:', { email, timestamp: new Date().toISOString() });
    
    try {
      const result = await signIn(email, password);
      console.log('📈 Resultado do login:', { 
        success: result.success, 
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      console.error('💥 Erro durante login:', error);
    }
  };

  // Debug logs para mudanças de estado do AdminLogin
  useEffect(() => {
    console.log('🔍 AdminLogin - Estado mudou:', {
      user: user?.id || 'null',
      userType,
      loading,
      timestamp: new Date().toISOString()
    });
  }, [user, userType, loading]);

  // Redirecionamento baseado no tipo de usuário
  if (user && userType && !loading) {
    console.log('✅ AdminLogin - Redirecionando usuário:', userType);
    if (userType === 'admin') {
      return <Navigate to="/home" replace />;
    } else if (userType === 'client') {
      return <Navigate to="/client" replace />;
    }
  }

  if (loading) {
    console.log('⏳ AdminLogin - Ainda carregando...');
    return (
      <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
        <BackgroundAnimation />
        <div className="relative z-10 text-white text-xl">Carregando...</div>
      </div>
    );
  }

  const handleForgotPassword = async (email: string) => {
    try {
      setForgotLoading(true);
      const result = await sendPasswordResetEmail(email);

      if (result.success) {
        setShowForgotPassword(false);
      }
    } finally {
      setForgotLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPasswordCard
        title="Recuperar Senha"
        description="Informe seu email administrativo para receber o link de redefinição."
        onBack={() => setShowForgotPassword(false)}
        onSubmit={handleForgotPassword}
        isLoading={forgotLoading}
      />
    );
  }

  console.log('🔐 AdminLogin - Exibindo tela de login');

  return (
    <SignInCard
      title="Bem-vindo Admin"
      subtitle="Faça login na área administrativa"
      showGoogleSignIn={false}
      showSignUpLink={false}
      showForgotPassword
      onForgotPasswordClick={() => setShowForgotPassword(true)}
      onSubmit={handleLogin}
      isLoading={loading}
    />
  );
};

export default AdminLogin;
