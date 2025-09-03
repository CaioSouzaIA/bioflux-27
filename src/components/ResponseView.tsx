import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft, Calendar, User, Upload } from 'lucide-react';
import { FormConfig, FormResponse } from '@/types/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DietView } from './DietView';
import { WhatsAppPopup } from './WhatsAppPopup';
import { DietPdfUploader } from './DietPdfUploader';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const [selectedDietResponse, setSelectedDietResponse] = useState<FormResponse | null>(null);
  const [selectedDietName, setSelectedDietName] = useState<string>('');
  const [dietPlan, setDietPlan] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const { userType } = useAuthContext();

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
      // Buscar o plano alimentar no Supabase usando o ID da resposta
      const { data: dietData, error } = await supabase
        .from('form_responses')
        .select('plano_alimentar')
        .eq('id', response.id)
        .single();

      if (error) {
        console.error('Erro ao buscar plano alimentar:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o plano alimentar.",
          variant: "destructive",
        });
        return;
      }

      setSelectedDietResponse(response);
      setSelectedDietName(getRespondentName(response));
      setDietPlan(dietData?.plano_alimentar || null);
    } catch (error) {
      console.error('Erro ao carregar plano alimentar:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar o plano alimentar.",
        variant: "destructive",
      });
    }
  };

  const handleViewTreino = (response: FormResponse) => {
    // Funcionalidade para ver treino - implementar conforme necessário
    toast({
      title: "Ver Treino",
      description: "Funcionalidade de treino em desenvolvimento.",
    });
  };

  const handleViewSupplementacao = (response: FormResponse) => {
    // Funcionalidade para ver suplementação - implementar conforme necessário
    toast({
      title: "Ver Suplementação",
      description: "Funcionalidade de suplementação em desenvolvimento.",
    });
  };

  const handleBackFromDiet = () => {
    setSelectedDietResponse(null);
    setSelectedDietName('');
    setDietPlan(null);
  };

  const toggleUploader = (responseId: string) => {
    setShowUploader(prev => ({
      ...prev,
      [responseId]: !prev[responseId]
    }));
  };

  const handleUploadSuccess = () => {
    toast({
      title: "Prescrição Enviada",
      description: "A prescrição de dieta foi enviada com sucesso para o cliente.",
    });
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
  if (selectedDietResponse) {
    return (
      <DietView
        response={selectedDietResponse}
        respondentName={selectedDietName}
        dietPlan={dietPlan}
        onBack={handleBackFromDiet}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando respostas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  navigate('/home');
                }
              }}
              className="border-gray-700 text-black bg-white hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <img 
              src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
              alt="BIOFLUX.AI" 
              className="h-12"
            />
            <div className="w-[100px]"></div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {singleResponse && respondentName 
                ? `Resposta de ${respondentName}` 
                : `Respostas - ${formConfig.title}`
              }
            </h1>
            <p className="text-gray-400">
              {singleResponse 
                ? 'Visualizando resposta individual'
                : `Total de respostas: ${responses.length}`
              }
            </p>
          </div>

          {responses.length === 0 ? (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400 text-lg">
                  Nenhuma resposta foi enviada ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {responses.map((response, index) => (
                <div key={response.id || index} className="space-y-4">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-cyan-500" />
                        {singleResponse && respondentName 
                          ? respondentName
                          : `Resposta #${response.id ? response.id.slice(-8) : index + 1}`
                        }
                      </CardTitle>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span className="hidden sm:inline">{formatDate(response.submittedAt)}</span>
                        </div>
                        <div className="flex gap-1 sm:gap-2">
                          {formConfig.category === 'anamnese-dieta' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDiet(response)}
                                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white text-xs sm:text-sm px-2 sm:px-3"
                              >
                                <span className="sm:mr-1">Ver Dieta</span>
                              </Button>
                              {userType === 'admin' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleUploader(response.id || '')}
                                  className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white text-xs sm:text-sm px-2 sm:px-3"
                                >
                                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">PDF</span>
                                </Button>
                              )}
                            </>
                          )}
                          {formConfig.category === 'anamnese-treino' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTreino(response)}
                              className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white text-xs sm:text-sm px-2 sm:px-3"
                            >
                              <span className="sm:mr-1">Ver Treino</span>
                            </Button>
                          )}
                          {formConfig.category === 'anamnese-suplementacao' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSupplementacao(response)}
                              className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white text-xs sm:text-sm px-2 sm:px-3"
                            >
                              <span className="sm:mr-1">Ver Suplementação</span>
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
                            className="bg-red-600 text-white border-red-600 hover:bg-white hover:text-red-600 text-xs sm:text-sm px-2 sm:px-3"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {Object.entries(response).filter(([key]) => 
                          key !== 'submittedAt' && key !== 'id'
                        ).map(([field, value]) => (
                          <div key={field} className="border-b border-gray-700 pb-3 last:border-b-0">
                            <label className="text-sm font-medium text-cyan-500 block mb-1">
                              {field}
                            </label>
                            <div className="text-white">
                              {formatResponseValue(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* PDF Uploader for diet responses */}
                  {showUploader[response.id || ''] && formConfig.category === 'anamnese-dieta' && userType === 'admin' && (
                    <DietPdfUploader
                      userId={response.user_id || ''}
                      formResponseId={response.id}
                      onUploadSuccess={handleUploadSuccess}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
