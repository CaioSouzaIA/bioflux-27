import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft, Calendar, User } from 'lucide-react';
import { FormConfig, FormResponse } from '@/types/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DietView } from './DietView';
import { TrainingView } from './TrainingView';
import { WhatsAppPopup } from './WhatsAppPopup';
import { useNavigate } from 'react-router-dom';
import type { DietPrescription } from '@/hooks/useDietPrescriptions';
import type { TrainingPrescription } from '@/hooks/useTrainingPrescriptions';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import ProfileDropdown from '@/components/ProfileDropdown';

interface ResponseViewProps {
  formConfig: FormConfig;
  response?: FormResponse;
  respondentName?: string;
  onBack: () => void;
}

export const ResponseView: React.FC<ResponseViewProps> = ({ 
  formConfig, 
  response: singleResponse, 
  respondentName, 
  onBack 
}) => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDietPrescription, setSelectedDietPrescription] = useState<DietPrescription | null>(null);
  const [selectedDietName, setSelectedDietName] = useState<string>('');
  const [selectedTrainingPrescription, setSelectedTrainingPrescription] = useState<TrainingPrescription | null>(null);
  const [selectedTrainingName, setSelectedTrainingName] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // If we have a single response, use it; otherwise load all responses
    if (singleResponse) {
      setResponses([singleResponse]);
      setLoading(false);
    } else {
      loadResponses();
    }
  }, [formConfig.id, singleResponse]);

  const loadResponses = async () => {
    try {
      setLoading(true);
      
      // Carregar respostas do Supabase
      const { data: supabaseResponses, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formConfig.id)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar respostas do Supabase:', error);
        // Fallback para localStorage
        await loadFromLocalStorage();
        return;
      }

      if (supabaseResponses && supabaseResponses.length > 0) {
        const formattedResponses: FormResponse[] = supabaseResponses.map(response => ({
          ...response.response_data as { [key: string]: any },
          id: response.id,
          submittedAt: response.submitted_at,
        }));
        
        setResponses(formattedResponses);
        console.log('Respostas carregadas do Supabase:', formattedResponses.length);
      } else {
        // Se não há respostas no Supabase, verificar localStorage
        await loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
      await loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = async () => {
    try {
      const savedResponses = localStorage.getItem('formResponses') || '{}';
      const responses = JSON.parse(savedResponses);
      
      if (responses[formConfig.id]) {
        setResponses(responses[formConfig.id]);
        console.log('Respostas carregadas do localStorage:', responses[formConfig.id].length);
      } else {
        setResponses([]);
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      setResponses([]);
    }
  };

  const handleDelete = async (responseId: string) => {
    try {
      // Tentar deletar do Supabase primeiro
      const { error } = await supabase
        .from('form_responses')
        .delete()
        .eq('id', responseId);

      if (error) {
        console.error('Erro ao deletar resposta do Supabase:', error);
        // Se falhar no Supabase, deletar do localStorage
        await deleteFromLocalStorage(responseId);
      } else {
        console.log('Resposta deletada do Supabase com sucesso');
      }

      // Atualizar estado local
      setResponses(prev => prev.filter(response => response.id !== responseId));
      
      toast({
        title: "Resposta Excluída",
        description: "A resposta foi excluída com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir resposta:', error);
      // Fallback para localStorage
      await deleteFromLocalStorage(responseId);
      setResponses(prev => prev.filter(response => response.id !== responseId));
      
      toast({
        title: "Resposta Excluída",
        description: "A resposta foi excluída localmente.",
        variant: "destructive",
      });
    }
  };

  const deleteFromLocalStorage = async (responseId: string) => {
    try {
      const savedResponses = localStorage.getItem('formResponses') || '{}';
      const responses = JSON.parse(savedResponses);
      
      if (responses[formConfig.id]) {
        responses[formConfig.id] = responses[formConfig.id].filter(
          (response: FormResponse) => response.id !== responseId
        );
        localStorage.setItem('formResponses', JSON.stringify(responses));
        console.log('Resposta deletada do localStorage');
      }
    } catch (error) {
      console.error('Erro ao deletar do localStorage:', error);
    }
  };

  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return 'Data não disponível';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const handleViewDiet = async (response: FormResponse) => {
    try {
      const respondent = getRespondentName(response);

      const { data: structuredPrescription, error } = await supabase
        .from('diet_prescriptions')
        .select('*')
        .eq('form_response_id', response.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar prescrição estruturada:', error);
      }

      if (structuredPrescription) {
        setSelectedDietName(respondent);
        setSelectedDietPrescription(structuredPrescription as DietPrescription);
        return;
      }

      const { data: legacyDietData, error: legacyError } = await supabase
        .from('form_responses')
        .select('plano_alimentar, submitted_at, user_id')
        .eq('id', response.id)
        .maybeSingle();

      if (legacyError) {
        throw legacyError;
      }

      if (!legacyDietData?.plano_alimentar) {
        toast({
          title: "Plano não encontrado",
          description: "Ainda não existe um plano alimentar associado a esta resposta.",
          variant: "destructive",
        });
        return;
      }

      setSelectedDietName(respondent);
      setSelectedDietPrescription({
        id: response.id || crypto.randomUUID(),
        user_id: legacyDietData.user_id || '',
        form_response_id: response.id || null,
        file_path: null,
        file_name: null,
        plan_name: `Plano alimentar legado - ${respondent}`,
        plan_sequence: 0,
        generation_status: 'completed',
        structured_plan: null,
        raw_plan_text: legacyDietData.plano_alimentar,
        generation_payload: null,
        model_slug: null,
        error_message: null,
        created_at: legacyDietData.submitted_at || response.submittedAt || new Date().toISOString(),
        updated_at: legacyDietData.submitted_at || response.submittedAt || null,
        completed_at: legacyDietData.submitted_at || response.submittedAt || null,
        status: 'active',
      });
    } catch (error) {
      console.error('Erro ao carregar plano alimentar:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar o plano alimentar.",
        variant: "destructive",
      });
    }
  };

  const handleViewTreino = async (response: FormResponse) => {
    try {
      const respondent = getRespondentName(response);

      const { data: structuredPrescription, error } = await supabase
        .from('training_prescriptions')
        .select('*')
        .eq('form_response_id', response.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar prescrição estruturada de treino:', error);
      }

      if (structuredPrescription) {
        setSelectedTrainingName(respondent);
        setSelectedTrainingPrescription(structuredPrescription as TrainingPrescription);
        return;
      }

      toast({
        title: "Plano não encontrado",
        description: "Ainda não existe um plano de treino associado a esta resposta.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Erro ao carregar plano de treino:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar o plano de treino.",
        variant: "destructive",
      });
    }
  };

  const handleViewSupplementacao = (response: FormResponse) => {
    // Funcionalidade para ver suplementação - implementar conforme necessário
    toast({
      title: "Ver Suplementação",
      description: "Funcionalidade de suplementação em desenvolvimento.",
    });
  };

  const handleBackFromDiet = () => {
    setSelectedDietPrescription(null);
    setSelectedDietName('');
  };

  const handleBackFromTraining = () => {
    setSelectedTrainingPrescription(null);
    setSelectedTrainingName('');
  };

  const getRespondentName = (response: FormResponse) => {
    console.log('getRespondentName - response completo:', response);
    
    // Buscar por chaves que contenham "nome" diretamente no response
    const responseKeys = Object.keys(response);
    console.log('getRespondentName - chaves do response:', responseKeys);
    
    const nameKey = responseKeys.find(key => 
      key.toLowerCase().includes('nome') || key.toLowerCase().includes('name')
    );
    
    if (nameKey && response[nameKey]) {
      const nameValue = response[nameKey];
      console.log('getRespondentName - encontrou nome direto:', nameKey, nameValue);
      if (typeof nameValue === 'string' && nameValue.trim()) {
        return nameValue.trim();
      }
      if (nameValue !== null && nameValue !== undefined && String(nameValue).trim()) {
        return String(nameValue).trim();
      }
    }
    
    // Se não encontrou no response direto, buscar nos campos do formulário
    if (formConfig) {
      const nameField = formConfig.fields.find(field => 
        field.label.toLowerCase().includes('nome') ||
        field.label.toLowerCase().includes('name')
      );
      
      if (nameField && response[nameField.id]) {
        const nameValue = response[nameField.id];
        console.log('getRespondentName - encontrou nome por field:', nameField.id, nameValue);
        if (typeof nameValue === 'string' && nameValue.trim()) {
          return nameValue.trim();
        }
        if (Array.isArray(nameValue) && nameValue.length > 0 && nameValue[0]) {
          return String(nameValue[0]).trim();
        }
        if (nameValue !== null && nameValue !== undefined && String(nameValue).trim()) {
          return String(nameValue).trim();
        }
      }
    }
    
    console.log('getRespondentName - não encontrou nome, retornando anônimo');
    return 'Respondente Anônimo';
  };

  const getRespondentWhatsApp = (response: FormResponse): string => {
    const whatsappField = Object.keys(response).find(key =>
      key.toLowerCase().includes('whatsapp')
    );
    if (whatsappField && response[whatsappField]) {
      const whatsappValue = response[whatsappField];
      return formatResponseValue(whatsappValue);
    }
    return '';
  };

  // Helper function to safely convert response values to string for display
  const formatResponseValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  // If está visualizando o plano alimentar
  if (selectedDietPrescription) {
    return (
      <DietView
        respondentName={selectedDietName}
        prescription={selectedDietPrescription}
        onBack={handleBackFromDiet}
      />
    );
  }

  if (selectedTrainingPrescription) {
    return (
      <TrainingView
        respondentName={selectedTrainingName}
        prescription={selectedTrainingPrescription}
        onBack={handleBackFromTraining}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black">
        <BackgroundAnimation />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
          <Card className="client-surface-panel w-full max-w-lg rounded-3xl text-white">
            <CardContent className="p-8 text-center text-lg">Carregando respostas...</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <BackgroundAnimation />

      <div className="relative z-10 min-h-screen p-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between pt-8">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else {
                    navigate('/home');
                  }
                }}
                className="client-back-button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <img 
                src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
                alt="BIOFLUX.AI" 
                className="h-10"
              />
            </div>

            <ProfileDropdown />
          </div>

          <Card className="client-surface-panel mb-6 rounded-3xl text-white">
            <CardHeader className="gap-4 p-6 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-2xl font-semibold text-white sm:text-3xl">
                  {singleResponse && respondentName 
                    ? `Resposta de ${respondentName}` 
                    : `Respostas - ${formConfig.title}`
                  }
                </CardTitle>
                <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                  {singleResponse 
                    ? 'Visualizando resposta individual'
                    : `Total de respostas: ${responses.length}`
                  }
                </div>
              </div>
              <p className="max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">
                Consulte os detalhes enviados, abra o plano relacionado quando existir e gerencie o registro dentro do padrão visual do admin.
              </p>
            </CardHeader>
          </Card>

          {responses.length === 0 ? (
            <Card className="client-surface-panel rounded-3xl text-white">
              <CardContent className="p-8 text-center">
                <p className="text-lg text-white/60">
                  Nenhuma resposta foi enviada ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {responses.map((response, index) => (
                <Card key={response.id || index} className="client-surface-panel rounded-3xl text-white">
                  <CardHeader className="gap-4 p-6 sm:p-8">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <CardTitle className="flex items-center gap-2 text-xl text-white sm:text-2xl">
                          <User className="h-5 w-5 text-cyan-500" />
                          {singleResponse && respondentName 
                            ? respondentName
                            : `Resposta #${response.id ? response.id.slice(-8) : index + 1}`
                          }
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(response.submittedAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {formConfig.category === 'anamnese-dieta' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDiet(response)}
                            className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                          >
                            Ver Dieta
                          </Button>
                        )}
                        {formConfig.category === 'anamnese-treino' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTreino(response)}
                            className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                          >
                            Ver Treino
                          </Button>
                        )}
                        {formConfig.category === 'anamnese-suplementacao' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSupplementacao(response)}
                            className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                          >
                            Ver Suplementação
                          </Button>
                        )}
                        {formConfig.category === 'feedback' && getRespondentWhatsApp(response) && (
                          <WhatsAppPopup 
                            leadWhatsApp={getRespondentWhatsApp(response)}
                            leadName={getRespondentName(response)}
                          />
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(response.id || '')}
                          className="bg-red-600 text-white border-red-600 hover:bg-white hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(response).filter(([key]) => 
                        key !== 'submittedAt' && key !== 'id'
                      ).map(([field, value]) => (
                        <div key={field} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <label className="mb-2 block text-sm font-medium uppercase tracking-[0.08em] text-cyan-400">
                            {field}
                          </label>
                          <div className="break-words text-white/90">
                            {formatResponseValue(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
