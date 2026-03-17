import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type UserType = 'admin' | 'client';

export interface UserProfile {
  id: string;
  user_type: UserType;
  email: string;
  activated: boolean;
  avatar_url?: string | null;
  created_at?: string;
  first_name?: string | null;
  updated_at: string;
  last_name?: string | null;
  onboarding_completed?: boolean;
  selected_badge_id?: string | null;
  whatsapp?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userType: UserType | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any; data?: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, whatsapp: string) => Promise<{ success: boolean; error?: any; data?: any }>;
  signOut: () => Promise<{ success: boolean; error?: any }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: any }>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: any }>;
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
  
  // Prevent StrictMode from duplicating bootstrap
  const bootstrapped = useRef(false);

  const clearInvalidSession = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ Erro ao limpar sessão inválida:', error);
    }

    setUser(null);
    setSession(null);
    setUserType(null);
    setUserProfile(null);
  };

  const validateSessionWithServer = async (candidateSession: Session | null) => {
    if (!candidateSession?.access_token) {
      return null;
    }

    const { data, error } = await supabase.auth.getUser(candidateSession.access_token);

    if (error || !data.user) {
      console.warn('⚠️ Sessão local inválida detectada. Limpando autenticação persistida.', error);
      await clearInvalidSession();
      return null;
    }

    return candidateSession;
  };

  // Fetch user profile and type
  const fetchUserProfile = async (userId: string): Promise<UserType> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, user_type, email, activated, updated_at, onboarding_completed, first_name, last_name, avatar_url, whatsapp, created_at, selected_badge_id')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        setUserType('client');
        setUserProfile(null);
        return 'client';
      }
      
      if (!profile) {
        // Create default profile
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
      setUserType(fetchedUserType);
      setUserProfile(profile as UserProfile);
      return fetchedUserType;
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar perfil:', error);
      setUserType('client');
      setUserProfile(null);
      return 'client';
    }
  };

  // Bootstrap effect - runs once
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    let unsub: (() => void) | null = null;

    (async () => {
      try {
        // 1) Get initial session
        console.log('🚀 AuthProvider: Bootstrapping session...');
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        const validatedInitialSession = await validateSessionWithServer(initialSession);

        if (validatedInitialSession?.user) {
          console.log('✅ Initial session found:', validatedInitialSession.user.id);
          setUser(validatedInitialSession.user);
          setSession(validatedInitialSession);
          await fetchUserProfile(validatedInitialSession.user.id);
        } else {
          console.log('🚫 No initial session');
        }

        setLoading(false);

        // 2) Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔔 Auth event:', event, session?.user?.id);

          void (async () => {
            const validatedSession =
              session?.access_token && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')
                ? await validateSessionWithServer(session)
                : session;

            setUser(validatedSession?.user ?? null);
            setSession(validatedSession ?? null);

            if (validatedSession?.user) {
              setLoading(true);
              await fetchUserProfile(validatedSession.user.id);
              setLoading(false);
              return;
            }

            if (event === 'SIGNED_OUT' || !validatedSession?.user) {
              setUserType(null);
              setUserProfile(null);
            }

            setLoading(false);
          })();
        });

        unsub = () => subscription.unsubscribe();
      } catch (error) {
        console.error('❌ Auth bootstrap error:', error);
        setLoading(false);
      }
    })();

    return () => {
      // Don't reset state - just unsubscribe
      if (unsub) unsub();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, whatsapp: string) => {
    try {
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
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
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
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
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
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      const normalizedEmail = email.trim();
      const { error } = await supabase.functions.invoke("send-password-reset-email", {
        body: {
          email: normalizedEmail,
          origin: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: 'Erro ao enviar recuperação',
          description: error.message,
          variant: 'destructive',
        });
        return { success: false, error };
      }

      toast({
        title: 'Email enviado',
        description: 'Confira sua caixa de entrada para criar uma nova senha.',
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar recuperação',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Iniciando logout...');
      
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

      console.log('Logout realizado com sucesso');
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro inesperado no logout:', error);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado.",
      });
      
      return { success: true };
    }
  };

  const refreshUserType = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userType,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updatePassword,
    sendPasswordResetEmail,
    refreshUserType,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
