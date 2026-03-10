import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormConfig, FormResponse, SupabaseFormResponse } from '@/types/form';
import { ArrowLeft, Calendar, User, Eye, MessageSquare, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { ResponseView } from '@/components/ResponseView';
import { WhatsAppPopup } from '@/components/WhatsAppPopup';
import { useToast } from '@/hooks/use-toast';

const FormResponses = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormConfig | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [selectedRespondentName, setSelectedRespondentName] = useState<string>('');
  const { user } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    console.log('FormResponses - formId:', formId);
    if (!formId) {
      setError('ID do formulário não fornecido');
      setLoading(false);
      return;
    }

    loadFormAndResponses();
  }, [formId, user]);

  const loadFormAndResponses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Carregando formulário e respostas para ID:', formId);

      // Buscar o formulário
      let foundForm: FormConfig | null = null;

      if (user) {
        console.log('Usuário autenticado, buscando no Supabase...');
        const { data: formData, error: formError } = await supabase
          .from('user_forms')
          .select('*')
          .eq('id', formId)
          .eq('user_id', user.id)
          .single();

        if (formError) {
          console.error('Erro ao buscar formulário no Supabase:', formError);
        } else if (formData) {
          foundForm = {
            id: formData.id,
            title: formData.title,
            description: formData.description || '',
            fields: (formData.form_data as any)?.fields || [],
            createdAt: formData.created_at,
            updatedAt: formData.updated_at,
            category: (formData.category as 'anamnese-dieta' | 'feedback' | 'livre' | 'anamnese-treino' | 'anamnese-suplementacao') || 'livre',
          };
          console.log('Formulário encontrado no Supabase:', foundForm);
        }
      }

      // Fallback para localStorage se não encontrou no Supabase
      if (!foundForm) {
        console.log('Buscando no localStorage...');
        const savedForms = localStorage.getItem('forms');
        if (savedForms) {
          try {
            const parsedForms: FormConfig[] = JSON.parse(savedForms);
            foundForm = parsedForms.find(f => f.id === formId) || null;
            console.log('Formulário encontrado no localStorage:', foundForm);
          } catch (error) {
            console.error('Erro ao parsear formulários do localStorage:', error);
          }
        }
      }

      if (!foundForm) {
        setError('Formulário não encontrado');
        setLoading(false);
        return;
      }

      setForm(foundForm);

      // Buscar as respostas do formulário
      if (user) {
        console.log('Buscando respostas no Supabase...');
        const { data: responsesData, error: responsesError } = await supabase
          .from('form_responses')
          .select('*')
          .eq('form_id', formId)
          .order('submitted_at', { ascending: false });

        if (responsesError) {
          console.error('Erro ao buscar respostas no Supabase:', responsesError);
          await loadResponsesFromLocalStorage();
        } else {
          console.log('Respostas encontradas no Supabase:', responsesData.length);
          const transformedResponses: FormResponse[] = responsesData.map((supabaseResponse: SupabaseFormResponse) => ({
            ...(supabaseResponse.response_data as { [key: string]: any }),
            id: supabaseResponse.id,
            submittedAt: supabaseResponse.submitted_at,
          }));
          setResponses(transformedResponses);
        }
      } else {
        await loadResponsesFromLocalStorage();
      }
    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
      setError('Erro ao carregar dados do formulário');
      await loadResponsesFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadResponsesFromLocalStorage = async () => {
    console.log('Carregando respostas do localStorage...');
    const savedResponses = localStorage.getItem('formResponses');
    if (savedResponses) {
      try {
        const parsedResponses = JSON.parse(savedResponses);
        if (parsedResponses[formId!]) {
          console.log('Respostas encontradas no localStorage:', parsedResponses[formId!].length);
          setResponses(parsedResponses[formId!].map((r: any) => ({
            ...r.data,
            id: r.id,
            submittedAt: r.timestamp,
          })));
        } else {
          console.log('Nenhuma resposta encontrada no localStorage para este formulário.');
          setResponses([]);
        }
      } catch (error) {
        console.error('Erro ao parsear respostas do localStorage:', error);
        setError('Erro ao carregar respostas do localStorage');
        setResponses([]);
      }
    } else {
      console.log('Nenhuma resposta salva encontrada no localStorage.');
      setResponses([]);
    }
  };

  const handleBack = () => {
    navigate('/home');
  };

  const handleViewResponse = (response: FormResponse) => {
    setSelectedResponse(response);
    const nameField = Object.keys(response).find(key =>
      key.toLowerCase().includes('nome')
    );
    if (nameField) {
      setSelectedRespondentName(response[nameField] as string);
    } else {
      setSelectedRespondentName('Respondente Anônimo');
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
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
      
      if (responses[formId!]) {
        responses[formId!] = responses[formId!].filter(
          (response: FormResponse) => response.id !== responseId
        );
        localStorage.setItem('formResponses', JSON.stringify(responses));
        console.log('Resposta deletada do localStorage');
      }
    } catch (error) {
      console.error('Erro ao deletar do localStorage:', error);
    }
  };

  const getRespondentName = (response: FormResponse) => {
    const nameField = Object.keys(response).find(key =>
      key.toLowerCase().includes('nome')
    );
    if (nameField && response[nameField]) {
      return response[nameField] as string;
    }
    return 'Respondente Anônimo';
  };

  const getRespondentWhatsApp = (response: FormResponse) => {
    const whatsappField = Object.keys(response).find(key =>
      key.toLowerCase().includes('whatsapp')
    );
    if (whatsappField && response[whatsappField]) {
      return response[whatsappField] as string;
    }
    return '';
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatWhatsApp = (whatsapp: string | number | boolean | string[] | null | undefined) => {
    if (!whatsapp) return 'Não informado';
    
    // Converter para string se não for
    const whatsappStr = String(whatsapp);
    
    // Se não tem pelo menos 10 dígitos, retorna como está
    if (whatsappStr.length < 10) return whatsappStr;
    
    // Aplicar formatação apenas se for um número válido
    const cleanNumber = whatsappStr.replace(/\D/g, '');
    if (cleanNumber.length === 11) {
      return cleanNumber.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanNumber.length === 10) {
      return cleanNumber.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return whatsappStr;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white">Carregando respostas...</div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl mb-4">Erro ao carregar respostas</h1>
        <p className="text-red-500">{error}</p>
        <Button onClick={handleBack} className="mt-4 bg-gray-700 hover:bg-gray-600">
          Voltar para a lista de formulários
        </Button>
      </div>
    );
  }

  // Se está visualizando uma resposta específica
  if (selectedResponse) {
    return (
      <ResponseView
        formConfig={form}
        response={selectedResponse}
        respondentName={selectedRespondentName}
        onBack={() => setSelectedResponse(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="client-back-button"
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

          <Card className="bg-[#161616] border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-cyan-400" />
                {form.title} - Respostas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-400">
                Total de respostas: {responses.length}
              </div>

              {responses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    Nenhuma resposta encontrada para este formulário.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-gray-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 bg-gray-700">
                        <TableHead className="text-gray-300">Respondente</TableHead>
                        <TableHead className="text-gray-300">WhatsApp</TableHead>
                        <TableHead className="text-gray-300">Data</TableHead>
                        <TableHead className="text-gray-300">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responses.map((response) => (
                        <TableRow key={response.id} className="border-gray-700 bg-gray-800 hover:bg-gray-750">
                          <TableCell className="text-white font-medium">
                            {getRespondentName(response)}
                          </TableCell>
                          <TableCell className="text-white">
                            {formatWhatsApp(getRespondentWhatsApp(response))}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(response.submittedAt || '')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {form.category === 'feedback' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewResponse(response)}
                                    className="border-white/15 text-white hover:bg-[#292929] hover:text-white"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver Feedback
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteResponse(response.id || '')}
                                    className="bg-red-600 text-white border-red-600 hover:bg-white hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : form.category === 'anamnese-dieta' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewResponse(response)}
                                    className="border-white/15 text-white hover:bg-[#292929] hover:text-white"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver Resposta
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteResponse(response.id || '')}
                                    className="bg-red-600 text-white border-red-600 hover:bg-white hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : form.category === 'anamnese-treino' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewResponse(response)}
                                    className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver Resposta
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteResponse(response.id || '')}
                                    className="bg-red-600 text-white border-red-600 hover:bg-white hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : form.category === 'anamnese-suplementacao' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewResponse(response)}
                                    className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver Suplementação
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteResponse(response.id || '')}
                                    className="bg-red-600 text-white border-red-600 hover:bg-white hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewResponse(response)}
                                    className="border-white/15 text-white hover:bg-[#292929] hover:text-white"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver Resposta
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteResponse(response.id || '')}
                                    className="bg-red-600 text-white border-red-600 hover:bg-white hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FormResponses;
