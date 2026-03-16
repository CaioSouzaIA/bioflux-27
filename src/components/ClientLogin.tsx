import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/contexts/AuthContext';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeClosed, ArrowRight, Phone, ArrowLeft } from 'lucide-react';
import { cn } from "@/lib/utils";
import PasswordReset from './PasswordReset';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import ForgotPasswordCard from './ForgotPasswordCard';

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

const sendWelcomeWebhook = async (firstName: string, lastName: string, email: string, whatsapp: string) => {
  try {
    const response = await fetch('https://webhook.n8n1.agenciaevodigital.com/webhook/saudacao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: firstName,
        sobrenome: lastName,
        email: email,
        whatsapp: whatsapp
      }),
    });

    if (response.ok) {
      console.log('✅ Webhook de boas-vindas enviado com sucesso');
    } else {
      console.error('❌ Erro ao enviar webhook de boas-vindas:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar webhook de boas-vindas:', error);
  }
};

const ClientLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const { signIn, signUp, loading, sendPasswordResetEmail } = useAuthContext();

  // For 3D card effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(email, password);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signUp(email, password, firstName, lastName, whatsapp);
    
    if (result.success) {
      // Enviar webhook de boas-vindas
      await sendWelcomeWebhook(firstName, lastName, email, whatsapp);
      
      // Resetar formulário
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setWhatsapp('');
      
      // Trocar para tab de login
      setActiveTab('login');
    }
  };

  const handleForgotPassword = async (forgotEmail: string) => {
    try {
      setForgotLoading(true);
      const result = await sendPasswordResetEmail(forgotEmail);

      if (result.success) {
        setShowForgotPassword(false);
      }
    } finally {
      setForgotLoading(false);
    }
  };
  if (showResetPassword) {
    return <PasswordReset onBack={() => setShowResetPassword(false)} />;
  }

  if (showForgotPassword) {
    return (
      <ForgotPasswordCard
        onBack={() => setShowForgotPassword(false)}
        onSubmit={handleForgotPassword}
        isLoading={forgotLoading}
      />
    );
  }

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />

      <div className="relative z-10 flex min-h-screen w-screen flex-col items-center justify-center px-4">
      {/* Logo acima da caixa de login */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="mb-8 z-10"
      >
        <img 
          src="/lovable-uploads/47b13cc6-5100-44ec-a86b-17a57bac71c6.png" 
          alt="BIOFLUX.AI" 
          className="h-24 mx-auto"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 10 }}
        >
          <div className="relative group">
            {/* Glass card background */}
            <div className="client-glass-card relative overflow-hidden rounded-3xl p-6" style={{ ['--card-glow' as string]: 'rgba(255,255,255,0.18)' }}> 
              {/* Logo and header */}
              <div className="text-center space-y-1 mb-5">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                >
                  {activeTab === 'signup' ? 'Crie sua conta' : 'Bem-vindo'}
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/60 text-xs"
                >
                  {activeTab === 'signup' ? 'Preencha seus dados para criar sua conta' : 'Faça login com seu email'}
                </motion.p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                  <TabsTrigger 
                    value="login" 
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-white/10"
                  >
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-white/10"
                  >
                    Cadastrar
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="mt-4">
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                      <CustomInput
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30"
                        required
                      />
                    </div>
                    
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                      <CustomInput
                        type={showPassword ? "text" : "password"}
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30"
                        required
                      />
                      <div 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 top-3 cursor-pointer"
                      >
                        {showPassword ? (
                          <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                        ) : (
                          <EyeClosed className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                        )}
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full relative group/button mt-5"
                    >
                      <div className="relative overflow-hidden bg-white text-black font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
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
                              Entrar
                              <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-white/60 hover:text-white text-xs transition-colors duration-300 underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 mt-4">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <CustomInput
                          type="text"
                          placeholder="Nome"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <CustomInput
                          type="text"
                          placeholder="Sobrenome"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                      <CustomInput
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30"
                        required
                      />
                    </div>
                    
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                      <CustomInput
                        type="text"
                        placeholder="DDD + Número"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="pl-10 bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30"
                        required
                      />
                    </div>
                    
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                      <CustomInput
                        type={showPassword ? "text" : "password"}
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30"
                        required
                      />
                      <div 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 top-3 cursor-pointer"
                      >
                        {showPassword ? (
                          <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                        ) : (
                          <EyeClosed className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                        )}
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full relative group/button mt-5"
                    >
                      <div className="relative overflow-hidden bg-white text-black font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
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
                              Cadastrar
                              <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  </form>
                </TabsContent>
              </Tabs>
              
              {/* Nota sobre verificação de email */}
              <div className="mt-4 text-xs text-center text-white/50">
                Ao cadastrar, você receberá um e-mail de confirmação.
                <br />Por favor, verifique sua caixa de entrada.
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
};

export default ClientLogin;
