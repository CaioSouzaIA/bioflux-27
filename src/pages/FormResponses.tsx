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
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import ProfileDropdown from '@/components/ProfileDropdown';

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

  if (error || !form) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-black">
        <BackgroundAnimation />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
          <Card className="client-surface-panel w-full max-w-xl rounded-3xl text-white">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <h1 className="text-2xl font-semibold">Erro ao carregar respostas</h1>
              <p className="text-red-400">{error}</p>
              <Button onClick={handleBack} className="client-action-button min-h-12 rounded-xl px-6">
                Voltar para a lista de formulários
              </Button>
            </CardContent>
          </Card>
        </div>
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
    <div className="min-h-screen relative overflow-hidden bg-black">
      <BackgroundAnimation />

      <div className="relative z-10 min-h-screen p-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between pt-8">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleBack}
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
                <CardTitle className="flex items-center gap-2 text-2xl text-white sm:text-3xl">
                  <User className="h-6 w-6 text-cyan-400" />
                  {form.title} - Respostas
                </CardTitle>
                <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                  Total de respostas: {responses.length}
                </div>
              </div>
              <p className="max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">
                Visualize os envios recebidos, abra respostas individuais e gerencie os registros desse formulário no mesmo padrão visual do painel.
              </p>
            </CardHeader>
          </Card>

          <Card className="client-surface-panel rounded-3xl text-white">
            <CardContent className="space-y-4 p-4 sm:p-6">
              {responses.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-white/60">
                    Nenhuma resposta encontrada para este formulário.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 bg-white/[0.04] hover:bg-white/[0.04]">
                          <TableHead className="text-white/70">Respondente</TableHead>
                          <TableHead className="text-white/70">WhatsApp</TableHead>
                          <TableHead className="text-white/70">Data</TableHead>
                          <TableHead className="text-white/70">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {responses.map((response) => (
                          <TableRow key={response.id} className="border-white/10 bg-transparent hover:bg-white/[0.03]">
                            <TableCell className="font-medium text-white">
                              {getRespondentName(response)}
                            </TableCell>
                            <TableCell className="text-white/80">
                              {formatWhatsApp(getRespondentWhatsApp(response))}
                            </TableCell>
                            <TableCell className="text-white/70">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(response.submittedAt || '')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
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
