import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Eye, EyeClosed } from 'lucide-react';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { cn } from "@/lib/utils";
import { useAuthContext } from '@/contexts/AuthContext';

function CustomInput({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword, user } = useAuthContext();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const result = await updatePassword(newPassword);

      if (result.success) {
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = newPassword === confirmPassword;
  const isPasswordValid = newPassword.length >= 6;
  const canSubmit = passwordsMatch && isPasswordValid && newPassword && confirmPassword && Boolean(user);

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header with back button */}
          <div className="flex items-center mb-8">
            <Button
              variant="outline"
              onClick={() => navigate('/client')}
              className="client-back-button"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Form card */}
          <div className="client-surface-panel rounded-3xl p-8">
            <h1 className="text-2xl font-bold text-white mb-6 text-center">
              Trocar Senha
            </h1>

            {user ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                  <CustomInput
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="client-input-surface pl-10 pr-10"
                    required
                  />
                  <div
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                    ) : (
                      <EyeClosed className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                  <CustomInput
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`client-input-surface pl-10 pr-10 ${
                      confirmPassword && !passwordsMatch ? 'border-red-500/50' : ''
                    }`}
                    required
                  />
                  <div
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 cursor-pointer"
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
                  {loading ? "Atualizando..." : "Atualizar Senha"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6 text-center">
                <p className="text-sm text-white/70">
                  Você precisa estar logado para trocar sua senha diretamente.
                </p>
                <Button
                  type="button"
                  onClick={() => navigate('/client')}
                  className="client-action-button w-full"
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

export default ChangePassword;
