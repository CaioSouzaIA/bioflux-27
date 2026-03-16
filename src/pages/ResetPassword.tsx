import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeClosed, Lock } from 'lucide-react';

import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

function CustomInput({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-11 w-full min-w-0 rounded-xl border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuthContext();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkRecoverySession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setHasRecoverySession(Boolean(data.session?.user));
      setCheckingSession(false);
    };

    void checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setHasRecoverySession(Boolean(session?.user));
      setCheckingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      const result = await updatePassword(newPassword);

      if (result.success) {
        setTimeout(() => {
          navigate('/client');
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = newPassword === confirmPassword;
  const isPasswordValid = newPassword.length >= 6;
  const canSubmit = passwordsMatch && isPasswordValid && Boolean(newPassword) && Boolean(confirmPassword) && hasRecoverySession;

  if (checkingSession) {
    return (
      <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
        <BackgroundAnimation />
        <div className="relative z-10 text-white text-xl">Validando link...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />

      <div className="relative z-10 flex min-h-screen w-screen flex-col items-center justify-center px-4">
        <div className="mb-8">
          <img
            src="/lovable-uploads/47b13cc6-5100-44ec-a86b-17a57bac71c6.png"
            alt="BIOFLUX.AI"
            className="h-24 mx-auto"
          />
        </div>

        <div className="w-full max-w-md">
          <div className="client-glass-card relative overflow-hidden rounded-3xl p-8" style={{ ['--card-glow' as string]: 'rgba(255,255,255,0.18)' }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                Criar nova senha
              </h1>
              <p className="mt-2 text-sm text-white/60">
                Defina uma nova senha para continuar no BIOFLUX.
              </p>
            </div>

            {hasRecoverySession ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-white/40" />
                  <CustomInput
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="pl-10 pr-10 bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30"
                    required
                  />
                  <div
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="absolute right-3 top-3.5 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                    ) : (
                      <EyeClosed className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-white/40" />
                  <CustomInput
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={`pl-10 pr-10 bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 ${
                      confirmPassword && !passwordsMatch ? 'border-red-500/50' : ''
                    }`}
                    required
                  />
                  <div
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-3.5 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                    ) : (
                      <EyeClosed className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  {newPassword && (
                    <div className={`transition-colors duration-300 ${
                      isPasswordValid ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isPasswordValid ? '✓' : '✗'} Pelo menos 6 caracteres
                    </div>
                  )}
                  {confirmPassword && (
                    <div className={`transition-colors duration-300 ${
                      passwordsMatch ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {passwordsMatch ? '✓' : '✗'} Senhas coincidem
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className={`w-full ${
                    !canSubmit ? 'opacity-50 cursor-not-allowed' : 'client-action-button'
                  }`}
                >
                  {loading ? 'Atualizando...' : 'Salvar nova senha'}
                </Button>
              </form>
            ) : (
              <div className="space-y-5 text-center">
                <p className="text-sm text-white/70">
                  Este link de recuperação é inválido ou expirou. Solicite um novo email na tela de login.
                </p>
                <Button
                  type="button"
                  className="client-action-button w-full"
                  onClick={() => navigate('/client')}
                >
                  Voltar para o login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
