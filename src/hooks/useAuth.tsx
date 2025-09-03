
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type UserType = 'admin' | 'client';

export interface UserProfile {
  id: string;
  user_type: UserType;
  email: string;
  activated: boolean;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserType = useCallback(async (userId: string): Promise<UserType> => {
    try {
      console.log('Buscando tipo de usuário para:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, user_type, email, activated, updated_at')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('Resposta da query profiles:', { profile, error });
      
      if (error) {
        console.error('Erro ao buscar perfil:', error);
        // Em caso de erro, assumir cliente e continuar
        setUserType('client');
        setUserProfile(null);
        return 'client';
      }
      
      if (!profile) {
        console.log('Perfil não encontrado, criando perfil padrão...');
        
        // Tentar criar perfil
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            user_type: 'client',
            email: user?.email || ''
          });
        
        if (insertError) {
          console.error('Erro ao criar perfil:', insertError);
        }
        
        setUserType('client');
        setUserProfile(null);
        return 'client';
      }
      
      const fetchedUserType = (profile.user_type as UserType) || 'client';
      console.log('Tipo de usuário encontrado:', fetchedUserType);
      setUserType(fetchedUserType);
      setUserProfile(profile as UserProfile);
      return fetchedUserType;
    } catch (error) {
      console.error('Erro inesperado ao buscar tipo de usuário:', error);
      // Em caso de erro, assumir cliente
      setUserType('client');
      setUserProfile(null);
      return 'client';
    }
  }, [user?.email]);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticação...');
        
        // Buscar sessão inicial primeiro
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao buscar sessão inicial:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        console.log('🔍 Sessão inicial:', initialSession?.user?.id || 'nenhuma');
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            console.log('✅ Usuário encontrado na sessão inicial, buscando tipo...');
            try {
              await fetchUserType(initialSession.user.id);
            } catch (error) {
              console.error('❌ Erro ao buscar tipo de usuário na inicialização:', error);
              setUserType('client'); // Fallback
            }
          } else {
            console.log('👤 Nenhum usuário na sessão inicial');
            setUserType(null);
            setUserProfile(null);
          }
          
          setLoading(false);
          console.log('🏁 Autenticação inicializada');
        }

        // Configurar listener depois da inicialização
        authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 Auth state changed:', event, session?.user?.id || 'sem usuário');
          
          if (!mounted) return;
          
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('🔐 Usuário logado, buscando tipo...');
            try {
              await fetchUserType(session.user.id);
            } catch (error) {
              console.error('❌ Erro ao buscar tipo de usuário:', error);
              setUserType('client'); // Fallback
            }
          } else {
            console.log('🚪 Usuário deslogado');
            setUserType(null);
            setUserProfile(null);
          }
        });

      } catch (error) {
        console.error('💥 Erro na inicialização da autenticação:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      console.log('🧹 Cleanup do useAuth');
      mounted = false;
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [fetchUserType]);

  // 3. Monitor de mudanças nos estados principais
  useEffect(() => {
    console.log('📊 Estado Auth mudou:', {
      user: user?.id || 'null',
      userType,
      loading,
      timestamp: new Date().toISOString()
    });
  }, [user, userType, loading]);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, whatsapp: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            whatsapp: whatsapp,
          },
          emailRedirectTo: `${window.location.origin}/client`
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Usuário já cadastrado",
            description: "Este email já está registrado. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no cadastro",
            description: error.message,
            variant: "destructive",
          });
        }
        return { success: false, error };
      }

      if (data.user && !data.session) {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar o cadastro antes de fazer login.",
        });
      }

      return { success: true, data };
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Tentando fazer login com:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Credenciais inválidas",
            description: "Email ou senha incorretos.",
            variant: "destructive",
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email não confirmado",
            description: "Verifique seu email e confirme o cadastro antes de fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive",
          });
        }
        return { success: false, error };
      }

      console.log('Login realizado com sucesso para usuário:', data.user?.id);
      
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta!",
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Erro inesperado no login:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      console.log('Atualizando senha do usuário...');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Erro ao atualizar senha:', error);
        toast({
          title: "Erro ao atualizar senha",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error };
      }

      console.log('Senha atualizada com sucesso');
      
      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro inesperado ao atualizar senha:', error);
      toast({
        title: "Erro ao atualizar senha",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Iniciando logout...');
      
      // Verificar se há uma sessão ativa antes de tentar fazer logout
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        console.log('Nenhuma sessão ativa encontrada, limpando estado local');
        // Limpar estado local mesmo sem sessão ativa
        setUser(null);
        setSession(null);
        setUserType(null);
        
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        });
        
        return { success: true };
      }
      
      console.log('Sessão ativa encontrada, fazendo logout...');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error);
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error };
      }

      // Limpar estado imediatamente após logout bem-sucedido
      setUser(null);
      setSession(null);
      setUserType(null);
      setUserProfile(null);

      console.log('Logout realizado com sucesso');
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro inesperado no logout:', error);
      
      // Mesmo com erro, limpar estado local
      setUser(null);
      setSession(null);
      setUserType(null);
      setUserProfile(null);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado.",
      });
      
      return { success: true }; // Retornar sucesso para evitar erros na UI
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    userType,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updatePassword,
  };
};
