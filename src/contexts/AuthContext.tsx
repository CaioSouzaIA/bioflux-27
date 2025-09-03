import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userType: UserType | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any; data?: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, whatsapp: string) => Promise<{ success: boolean; error?: any; data?: any }>;
  signOut: () => Promise<{ success: boolean; error?: any }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: any }>;
  refreshUserType: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs para prevenir múltiplas execuções
  const authListenerRef = useRef<any>(null);
  const initializingRef = useRef(false);
  const fetchingUserTypeRef = useRef(false);

  // Função memoizada para buscar tipo de usuário
  const fetchUserType = useCallback(async (userId: string): Promise<UserType> => {
    // Previne múltiplas chamadas simultâneas
    if (fetchingUserTypeRef.current) {
      console.log('⏸️ Busca de tipo já em andamento, ignorando...');
      return 'client';
    }

    fetchingUserTypeRef.current = true;
    
    try {
      console.log('🔍 Buscando tipo de usuário para:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, user_type, email, activated, updated_at')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('✅ Resposta da query profiles:', { profile, error });
      
      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        setUserType('client');
        setUserProfile(null);
        return 'client';
      }
      
      if (!profile) {
        console.log('👤 Perfil não encontrado, criando perfil padrão...');
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            user_type: 'client',
            email: user?.email || ''
          });
        
        if (insertError) {
          console.error('❌ Erro ao criar perfil:', insertError);
        }
        
        setUserType('client');
        setUserProfile(null);
        return 'client';
      }
      
      const fetchedUserType = (profile.user_type as UserType) || 'client';
      console.log('✅ Tipo de usuário encontrado:', fetchedUserType);
      setUserType(fetchedUserType);
      setUserProfile(profile as UserProfile);
      return fetchedUserType;
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar tipo de usuário:', error);
      setUserType('client');
      setUserProfile(null);
      return 'client';
    } finally {
      fetchingUserTypeRef.current = false;
    }
  }, [user?.email]);

  // Inicialização única da autenticação
  useEffect(() => {
    // Previne múltiplas inicializações
    if (initializingRef.current || isInitialized) {
      return;
    }

    initializingRef.current = true;
    console.log('🚀 AuthProvider: Inicializando autenticação (ÚNICA VEZ)...');

    const initializeAuth = async () => {
      try {
        // 1. Buscar sessão atual
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão inicial:', error);
          setLoading(false);
          setIsInitialized(true);
          return;
        }

        console.log('🔍 Sessão inicial:', initialSession?.user?.id || 'nenhuma');

        // 2. Se há sessão, buscar tipo de usuário
        if (initialSession?.user) {
          console.log('👤 Sessão encontrada:', initialSession.user.id);
          setSession(initialSession);
          setUser(initialSession.user);
          
          const type = await fetchUserType(initialSession.user.id);
          setUserType(type);
        } else {
          console.log('🚫 Nenhuma sessão ativa');
          setUser(null);
          setSession(null);
          setUserType(null);
          setUserProfile(null);
        }

        // 3. Configurar listener (APENAS UMA VEZ)
        if (!authListenerRef.current) {
          console.log('👂 Configurando listener de auth...');
          
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('🔔 Auth event:', event, session?.user?.id);

              setSession(session);
              setUser(session?.user ?? null);

              if (session?.user && event === 'SIGNED_IN') {
                console.log('🔐 Usuário logado, buscando tipo...');
                const type = await fetchUserType(session.user.id);
                setUserType(type);
              } else if (event === 'SIGNED_OUT') {
                console.log('🚪 Usuário deslogado');
                setUser(null);
                setSession(null);
                setUserType(null);
                setUserProfile(null);
              }
            }
          );

          authListenerRef.current = subscription;
        }

      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error);
      } finally {
        setLoading(false);
        setIsInitialized(true);
        initializingRef.current = false;
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      console.log('🧹 Limpando AuthProvider...');
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
      initializingRef.current = false;
    };
  }, []); // Array vazio - executa APENAS UMA VEZ

  // Debug - monitorar mudanças de estado
  useEffect(() => {
    console.log('📊 AuthProvider - Estado atualizado:', {
      user: user?.id || 'null',
      userType,
      loading,
      isInitialized,
      timestamp: new Date().toISOString()
    });
  }, [user, userType, loading, isInitialized]);

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
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        console.log('Nenhuma sessão ativa encontrada, limpando estado local');
        setUser(null);
        setSession(null);
        setUserType(null);
        setUserProfile(null);
        
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
      
      setUser(null);
      setSession(null);
      setUserType(null);
      setUserProfile(null);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado.",
      });
      
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const refreshUserType = async () => {
    if (user) {
      await fetchUserType(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userType,
    userProfile,
    loading,
    isInitialized,
    signIn,
    signUp,
    signOut,
    updatePassword,
    refreshUserType,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};