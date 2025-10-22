import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { toast } from '@/hooks/use-toast';
import { FileText, ArrowLeft, Lock } from 'lucide-react';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

interface Form {
  id: string;
  title: string;
  category: string;
  description?: string;
  user_id: string;
}

const ClientForms: React.FC = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const { data: subscriptions = [], isLoading: subscriptionLoading } = useSubscriptions();

  // Verificar se o cliente já completou os formulários
  const activeSubscription = subscriptions.find(sub => sub.status === 'ativo');
  const formsCompleted = activeSubscription?.forms_completed || false;

  // Usar useQuery para melhor gerenciamento de estado
  const { data: forms = [], isLoading, error } = useQuery({
    queryKey: ['client-forms', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('Usuário não disponível');
      }

      console.log('Iniciando carregamento de formulários para cliente:', user.id);
      
      // Buscar assinaturas ativas do cliente
      const { data: subscriptions, error: subError } = await supabase
        .from('client_subscriptions')
        .select('service_type')
        .eq('user_id', user.id)
        .eq('status', 'ativo');

      if (subError) {
        console.error('Erro ao buscar assinaturas:', subError);
        throw subError;
      }

      console.log('Assinaturas encontradas:', subscriptions);

      // Determinar categorias permitidas
      const allowedCategories = ['feedback'];
      subscriptions?.forEach(sub => {
        if (sub.service_type === 'dieta' || sub.service_type === 'treino-dieta') {
          allowedCategories.push('anamnese-dieta');
        }
        if (sub.service_type === 'treino' || sub.service_type === 'treino-dieta') {
          allowedCategories.push('anamnese-treino');
        }
      });

      console.log('Categorias permitidas:', allowedCategories);

      // Buscar formulários de admins usando a função RPC
      const { data: adminIds, error: rpcError } = await supabase
        .rpc('get_admin_ids');

      if (rpcError) {
        console.error('Erro ao buscar IDs de admin via RPC:', rpcError);
        throw rpcError;
      }
      
      console.log('Admins encontrados:', adminIds?.length || 0);

      if (adminIds && adminIds.length > 0) {
        console.log('Buscando formulários dos admins:', adminIds);
        
        const { data: formsData, error: formsError } = await supabase
          .from('user_forms')
          .select('*')
          .in('user_id', adminIds)
          .in('category', allowedCategories);

        if (formsError) {
          console.error('Erro ao buscar formulários:', formsError);
          throw formsError;
        }

        console.log('Formulários encontrados:', formsData?.length || 0);
        return formsData || [];
      } else {
        console.log('Nenhum admin encontrado');
        return [];
      }
    },
    enabled: !!user && !subscriptionLoading,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true, // Recarregar quando a janela volta ao foco
    retry: 3,
  });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/client');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'anamnese-dieta':
        return 'Anamnese - Dieta';
      case 'anamnese-treino':
        return 'Anamnese - Treino';
      case 'feedback':
        return 'Feedback';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'anamnese-dieta':
        return 'bg-green-100 text-green-800';
      case 'anamnese-treino':
        return 'bg-orange-100 text-orange-800';
      case 'feedback':
        return 'bg-[#1f1f1f] text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFormAccess = (formId: string) => {
    // Verificar se o usuário pode acessar formulários
    if (formsCompleted) {
      toast({
        title: "Formulários já preenchidos",
        description: "Você já preencheu os formulários neste período. Aguarde a renovação da sua assinatura para preencher novamente.",
        variant: "destructive",
      });
      return;
    }
    
    // Navegar para o formulário na mesma aba
    navigate(`/form/${formId}`);
  };

  // Se ainda está carregando e o usuário existe
  if ((isLoading || subscriptionLoading) && user) {
    return (
      <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
        <BackgroundAnimation />
        <div className="relative z-10 text-white text-xl">Carregando formulários...</div>
      </div>
    );
  }

  // Se não há usuário logado
  if (!user) {
    return (
      <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
        <BackgroundAnimation />
        <div className="relative z-10 text-white text-xl">Redirecionando...</div>
      </div>
    );
  }

  // Se houve erro no carregamento
  if (error) {
    return (
      <div className="min-h-screen relative bg-black overflow-hidden flex items-center justify-center">
        <BackgroundAnimation />
        <div className="relative z-10 text-center">
          <div className="text-red-400 text-xl mb-4">Erro ao carregar formulários</div>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />
      
      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pt-8">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/client')}
                className="bg-[#161616] border-white text-white hover:bg-gray-800 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <img 
                src="/lovable-uploads/47b13cc6-5100-44ec-a86b-17a57bac71c6.png" 
                alt="BIOFLUX.AI" 
                className="h-10"
              />
            </div>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Formulários Disponíveis</h1>
            <p className="text-gray-300">
              Preencha os formulários para nos ajudar a criar a melhor prescrição para você
            </p>
            {formsCompleted && (
              <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Lock className="w-5 h-5" />
                  <span className="font-medium">Formulários já preenchidos neste período</span>
                </div>
                <p className="text-yellow-300 text-sm mt-2">
                  Você já preencheu os formulários disponíveis. Aguarde a renovação da sua assinatura para preencher novamente.
                </p>
              </div>
            )}
          </div>

          {/* Lista de Formulários */}
          <div className="grid gap-6">
            {forms.length === 0 ? (
              <Card className="bg-[#161616] border-black backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Nenhum formulário disponível
                  </h3>
                  <p className="text-gray-400">
                    Não há formulários disponíveis para suas assinaturas ativas no momento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              forms.map((form) => (
                <Card key={form.id} className={`bg-[#161616] border-black backdrop-blur-sm transition-all ${formsCompleted ? 'opacity-60' : 'hover:bg-[#1c1c1c]'}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white flex items-center gap-3">
                          {formsCompleted ? <Lock className="w-5 h-5 text-yellow-400" /> : <FileText className="w-5 h-5" />}
                          {form.title}
                        </CardTitle>
                        {form.description && (
                          <CardDescription className="text-gray-300 mt-2">
                            {form.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge className={getCategoryColor(form.category)}>
                        {getCategoryLabel(form.category)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className={`w-full ${formsCompleted ? 'bg-gray-600 hover:bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                      onClick={() => handleFormAccess(form.id)}
                      disabled={formsCompleted}
                    >
                      {formsCompleted ? 'Formulário Bloqueado' : 'Preencher Formulário'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientForms;