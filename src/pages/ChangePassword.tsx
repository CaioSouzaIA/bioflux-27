import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Eye, EyeClosed, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { cn } from "@/lib/utils";

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
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro", 
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@') || email.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('https://webhook.n8n1.agenciaevodigital.com/webhook/trocarsenha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          nova_senha: newPassword
        }),
      });

      if (response.ok) {
        toast({
          title: "Senha redefinida com sucesso",
          description: "Sua senha foi atualizada com sucesso.",
        });
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
          navigate('/client');
        }, 1000);
      } else {
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar a senha.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
      toast({
        title: "Erro no envio",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = newPassword === confirmPassword;
  const isPasswordValid = newPassword.length >= 6;
  const isEmailValid = email.includes('@') && email.length > 0;
  const canSubmit = passwordsMatch && isPasswordValid && isEmailValid && newPassword && confirmPassword && email;

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
              className="bg-[#161616] border-white text-white hover:bg-gray-800 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Form card */}
          <div className="bg-[#161616] border-white rounded-lg p-8">
            <h1 className="text-2xl font-bold text-white mb-6 text-center">
              Trocar Senha
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                <CustomInput
                  type="email"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-white/30"
                  required
                />
              </div>

              {/* Nova senha */}
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                <CustomInput
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder:text-white/30"
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

              {/* Confirmar senha */}
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                <CustomInput
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder:text-white/30 ${
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

              {/* Validação visual */}
              <div className="space-y-1 text-xs">
                {email && (
                  <div className={`transition-colors duration-300 ${
                    isEmailValid ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isEmailValid ? '✓' : '✗'} Email válido
                  </div>
                )}
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
              
              {/* Botão de atualizar */}
              <Button
                type="submit"
                disabled={!canSubmit || loading}
                className={`w-full ${
                  !canSubmit ? 'opacity-50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {loading ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;