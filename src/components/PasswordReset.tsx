import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeClosed, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from '@/hooks/use-toast';

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

interface PasswordResetProps {
  onBack: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return; // Será tratado pela validação visual
    }

    if (newPassword.length < 6) {
      return; // Será tratado pela validação visual
    }

    try {
      setLoading(true);
      
      const response = await fetch('https://webhook.n8n1.agenciaevodigital.com/webhook/recuperar', {
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
          title: "Senha atualizada!",
          description: "Sua senha foi atualizada com sucesso.",
        });
        
        // Redirecionar após 1 segundo
        setTimeout(() => {
          onBack();
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
    <>
      {/* Background gradient effect - fixed para tela inteira */}
      <div className="fixed inset-0 w-screen h-screen z-0 bg-gradient-to-b from-cyan-500/40 via-cyan-700/50 to-black" />
      
      {/* Subtle noise texture overlay */}
      <div className="fixed inset-0 w-screen h-screen z-0 opacity-[0.03] mix-blend-soft-light" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      {/* Animated background effects */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-cyan-400/20 blur-[80px] z-0" />
      <motion.div 
        className="fixed top-0 left-1/2 transform -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full bg-cyan-300/20 blur-[60px] z-0"
        animate={{ 
          opacity: [0.15, 0.3, 0.15],
          scale: [0.98, 1.02, 0.98]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          repeatType: "mirror"
        }}
      />

      {/* Container principal com tela inteira */}
      <div className="relative flex flex-col items-center justify-center min-h-screen w-screen z-10">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <img 
            src="/lovable-uploads/47b13cc6-5100-44ec-a86b-17a57bac71c6.png" 
            alt="BIOFLUX.AI" 
            className="h-16 mx-auto"
          />
        </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="relative">
          <div className="relative group">
            {/* Glass card background */}
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="text-center space-y-1 mb-5">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                >
                  Redefinir Senha
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/60 text-xs"
                >
                  Digite sua nova senha
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                  <CustomInput
                    type="email"
                    placeholder="Digite seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30"
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
                    className="pl-10 pr-10 bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30"
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
                    className={`pl-10 pr-10 bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 ${
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
                <motion.button
                  whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                  whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                  type="submit"
                  disabled={!canSubmit || loading}
                  className={`w-full relative group/button mt-5 ${
                    !canSubmit ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className={`relative overflow-hidden ${
                    canSubmit ? 'bg-white text-black' : 'bg-gray-600 text-gray-400'
                  } font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center`}>
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="w-4 h-4 border-2 border-black/70 border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="button-text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-1 text-sm font-medium"
                        >
                          Atualizar Senha
                          <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {/* Botão voltar */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onBack}
                  className="w-full text-white/60 hover:text-white text-sm transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Voltar
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
      </div>
    </>
  );
};

export default PasswordReset;