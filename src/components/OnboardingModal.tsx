import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Smartphone, FileText, Activity } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const OnboardingModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, userProfile, refreshUserType } = useAuthContext();

  useEffect(() => {
    // Verificar se deve mostrar o modal
    if (user && userProfile && !userProfile.onboarding_completed) {
      setIsOpen(true);
    }
  }, [user, userProfile]);

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Marcar onboarding como completo no perfil
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao marcar onboarding como completo:', error);
        toast({
          title: "Erro",
          description: "Não foi possível salvar o progresso.",
          variant: "destructive",
        });
        return;
      }

      // Atualizar o contexto
      await refreshUserType();
      setIsOpen(false);

      toast({
        title: "Bem-vindo!",
        description: "Agora você pode começar a usar nossa plataforma.",
      });
    } catch (error) {
      console.error('Erro no onboarding:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      icon: <Activity className="h-8 w-8 text-primary" />,
      title: "1. Responda a avaliação metabólica",
      description: "Complete sua avaliação para que possamos calcular suas necessidades calóricas e metabólicas personalizadas."
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "2. Responda o formulário",
      description: "Preencha o formulário detalhado com suas preferências, objetivos e informações pessoais."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: "3. Receba no seu WhatsApp o protocolo",
      description: "Seu protocolo personalizado de dieta e treino será enviado diretamente para o seu WhatsApp."
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl mb-2">
            Bem-vindo! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Para começar a usar nossa plataforma, siga estes 3 passos simples:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                {step.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleComplete} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              "Carregando..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Entendi, vamos começar!
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;