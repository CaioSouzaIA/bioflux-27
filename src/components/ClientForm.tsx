
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Send } from 'lucide-react';
import { FormConfig, FormResponse } from '@/types/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface ClientFormProps {
  formConfig: FormConfig;
  onBack: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ formConfig, onBack }) => {
  const [formData, setFormData] = useState<FormResponse>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();

  // Debug logs para investigar problema com campos
  console.log('🔍 ClientForm - Debugging form fields:');
  console.log('📋 formConfig completo:', formConfig);
  console.log('📋 formConfig.fields:', formConfig.fields);
  console.log('📋 formConfig.fields length:', formConfig.fields?.length || 0);
  console.log('📋 formConfig.category:', formConfig.category);
  
  if (formConfig.fields) {
    formConfig.fields.forEach((field, index) => {
      console.log(`📋 Campo ${index}:`, {
        id: field.id,
        type: field.type,
        label: field.label,
        order: field.order,
        required: field.required,
        options: field.options
      });
    });
  }

  const updateFormData = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const validateForm = () => {
    for (const field of formConfig.fields) {
      if (field.required && (!formData[field.id] || formData[field.id] === '')) {
        toast({
          title: "Erro de Validação",
          description: `O campo "${field.label}" é obrigatório.`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'anamnese-dieta':
        return 'Anamnese - Dieta';
      case 'anamnese-treino':
        return 'Anamnese - Treino';
      case 'anamnese-suplementacao':
        return 'Anamnese - Suplementação';
      case 'feedback':
        return 'Feedback';
      case 'livre':
        return 'Formulário Livre';
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
      case 'anamnese-suplementacao':
        return 'bg-purple-100 text-purple-800';
      case 'feedback':
        return 'bg-[#1f1f1f] text-white';
      case 'livre':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função separada para buscar apenas o ai_config do dono do formulário
  const getFormOwnerAiConfig = async () => {
    try {
      console.log('🔍 Iniciando busca do AI Config do dono do formulário...');
      console.log('📋 Form ID:', formConfig.id);
      
      // Buscar o user_id do dono do formulário
      const { data: formOwner, error: formError } = await supabase
        .from('user_forms')
        .select('user_id')
        .eq('id', formConfig.id)
        .maybeSingle();

      console.log('📋 Query user_forms - formConfig.id:', formConfig.id);
      console.log('📋 Resultado da busca do formulário:', { formOwner, formError });

      if (formError || !formOwner?.user_id) {
        console.log('⚠️ Não foi possível encontrar o dono do formulário');
        console.log('⚠️ formError:', formError);
        console.log('⚠️ formOwner:', formOwner);
        return null;
      }

      console.log('✅ User ID do dono do formulário encontrado:', formOwner.user_id);

      // Buscar APENAS a coluna ai_config usando o user_id do dono do formulário
      console.log('🤖 Executando query para profiles com user_id do dono:', formOwner.user_id);
      
      const { data: aiConfigData, error: aiConfigError } = await supabase
        .from('profiles')
        .select('ai_config')
        .eq('id', formOwner.user_id)
        .maybeSingle();

      console.log('🤖 Query profiles - user_id do dono usado:', formOwner.user_id);
      console.log('🤖 Resultado da busca do AI Config:', { aiConfigData, aiConfigError });
      console.log('🤖 aiConfigData completo:', JSON.stringify(aiConfigData, null, 2));

      if (aiConfigError) {
        console.error('❌ Erro ao buscar AI Config:', aiConfigError);
        return null;
      }

      if (!aiConfigData) {
        console.log('⚠️ Nenhum perfil encontrado para o dono do formulário');
        console.log('⚠️ User ID do dono usado na busca:', formOwner.user_id);
        return null;
      }

      console.log('🎯 AI Config encontrado:', aiConfigData.ai_config);
      console.log('🎯 Tipo do ai_config:', typeof aiConfigData.ai_config);
      console.log('🎯 AI Config stringified:', JSON.stringify(aiConfigData.ai_config, null, 2));
      
      return aiConfigData.ai_config;

    } catch (error) {
      console.error('💥 Erro geral na busca do AI Config:', error);
      return null;
    }
  };

  const saveResponseToSupabase = async (formattedData: { [key: string]: any }) => {
    try {
      console.log('💾 Salvando resposta no Supabase...');
      console.log('📊 Dados a serem salvos:', formattedData);
      console.log('👤 User ID do cliente:', user?.id);
      console.log('📋 Form ID:', formConfig.id);

      const { data: savedResponse, error } = await supabase
        .from('form_responses')
        .insert({
          form_id: formConfig.id,
          response_data: formattedData,
          submitted_at: new Date().toISOString(),
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar resposta no Supabase:', error);
        throw error;
      }

      console.log('✅ Resposta salva no Supabase com sucesso:', savedResponse);
      return savedResponse;
    } catch (error) {
      console.error('💥 Erro ao salvar no Supabase:', error);
      // Fallback para localStorage
      await saveResponseToLocalStorage(formattedData);
      throw error;
    }
  };

  const saveResponseToLocalStorage = async (formattedData: { [key: string]: any }) => {
    try {
      const savedResponses = localStorage.getItem('formResponses') || '{}';
      const responses = JSON.parse(savedResponses);
      
      if (!responses[formConfig.id]) {
        responses[formConfig.id] = [];
      }
      
      responses[formConfig.id].push({
        id: Date.now().toString(),
        formId: formConfig.id,
        data: formattedData,
        timestamp: new Date().toISOString(),
        user_id: user?.id,
      });
      
      localStorage.setItem('formResponses', JSON.stringify(responses));
      console.log('💾 Resposta salva no localStorage como backup');
    } catch (error) {
      console.error('❌ Erro ao salvar resposta localmente:', error);
    }
  };

  const sendToWebhook = async (webhookPayload: any, webhookUrl: string) => {
    try {
      console.log('🚀 Enviando para webhook:', webhookUrl);
      console.log('🚀 Payload:', JSON.stringify(webhookPayload, null, 2));
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });
      
      console.log('✅ Webhook enviado com sucesso. Status:', response.status);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar para webhook:', error);
      throw error;
    }
  };

  const sendDietIntakeToSupabase = async (webhookPayload: any) => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Erro ao obter sessão antes de chamar a Edge Function:', sessionError);
      throw sessionError;
    }

    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      throw new Error('Sessão inválida para iniciar a geração da dieta.');
    }

    const { data, error } = await supabase.functions.invoke('diet-intake-webhook', {
      body: webhookPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error) {
      console.error('❌ Erro ao iniciar geração da dieta:', error);
      throw error;
    }

    console.log('✅ Fluxo de dieta iniciado:', data);
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Verificar se o usuário está logado
    if (!user) {
      toast({
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para enviar o formulário.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log("📤 Iniciando envio do formulário");
    console.log("👤 Cliente logado:", user.id);

    // Converter os dados do formulário para usar os labels dos campos
    const formattedData: { [key: string]: any } = {};
    formConfig.fields.forEach(field => {
      if (formData[field.id] !== undefined) {
        formattedData[field.label] = formData[field.id];
      }
    });

    try {
      // Primeiro salvar a resposta no Supabase
      console.log('💾 Salvando resposta na base de dados...');
      const savedResponse = await saveResponseToSupabase(formattedData);
      
      // Buscar o AI Config do dono do formulário
      console.log('🔄 Buscando AI Config do dono do formulário...');
      const aiConfig = await getFormOwnerAiConfig();
      
      console.log('🎯 AI Config do dono do formulário recebido:', aiConfig);
      console.log('🎯 Tipo do AI Config:', typeof aiConfig);

      // Determinar URL do webhook baseado na categoria
      let webhookUrl = 'https://webhook.n8n1.agenciaevodigital.com/webhook/dieta'; // URL padrão
      
      if (formConfig.category === 'anamnese-treino') {
        webhookUrl = 'https://webhook.n8n1.agenciaevodigital.com/webhook/treino';
      }

      // Preparar payload final para webhook COM o user_id do CLIENTE que está respondendo
      const webhookPayload = {
        formTitle: formConfig.title,
        timestamp: new Date().toISOString(),
        responses: formattedData,
        submittedFrom: window.location.origin,
        formId: formConfig.id,
        userId: user.id, // User ID do cliente logado
        aiConfig: aiConfig, // AI Config do dono do formulário
        category: formConfig.category,
        clientId: user.id, // Campo específico para o cliente
        formOwnerId: formConfig.user_id, // User ID do dono do formulário
        formResponseId: savedResponse?.id, // ID da resposta salva no Supabase
      };

      console.log('📦 Payload FINAL para webhook:', JSON.stringify(webhookPayload, null, 2));
      console.log('🔗 Webhook URL:', webhookUrl);
      console.log('👤 User ID do cliente no payload:', user.id);
      console.log('💾 Form Response ID:', savedResponse?.id);

      if (formConfig.category === 'anamnese-dieta') {
        await sendDietIntakeToSupabase(webhookPayload);
      } else {
        await sendToWebhook(webhookPayload, webhookUrl);
      }

      toast({
        title: "Formulário Enviado!",
        description: formConfig.category === 'anamnese-dieta'
          ? "Suas respostas foram enviadas. O plano alimentar já entrou em geração."
          : "Suas respostas foram enviadas com sucesso. Obrigado!",
      });

      // Usar callback onBack em vez de redirecionamento direto
      setTimeout(() => {
        onBack();
      }, 2000);

      // Limpar formulário após envio
      setFormData({});
    } catch (error) {
      console.error('❌ Erro ao enviar formulário:', error);
      toast({
        title: "Erro no Envio",
        description: "Houve um problema ao enviar o formulário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    console.log('🎨 Renderizando campo:', {
      id: field.id,
      type: field.type,
      label: field.label,
      required: field.required,
      options: field.options
    });

    const value = formData[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input
            type={field.type}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => updateFormData(field.id, parseFloat(e.target.value) || '')}
            placeholder={field.placeholder}
            required={field.required}
            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
          />
        );

      case 'select':
        return (
          <Select value={typeof value === 'string' ? value : ''} onValueChange={(val) => updateFormData(field.id, val)}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {field.options?.map((option: string, index: number) => (
                <SelectItem key={index} value={option} className="text-white hover:bg-gray-700">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={typeof value === 'string' ? value : ''}
            onValueChange={(val) => updateFormData(field.id, val)}
          >
            {field.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}_${index}`} className="border-gray-600 text-cyan-400" />
                <Label htmlFor={`${field.id}_${index}`} className="text-white">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true}
              onCheckedChange={(checked) => updateFormData(field.id, checked)}
              id={field.id}
              className="border-gray-600 data-[state=checked]:bg-green-600"
            />
            <Label htmlFor={field.id} className="text-white">{field.label}</Label>
          </div>
        );

      default:
        console.warn('⚠️ Tipo de campo não reconhecido:', field.type);
        return (
          <div className="text-red-400 text-sm">
            Tipo de campo não suportado: {field.type}
          </div>
        );
    }
  };

  // Verificar se formConfig.fields existe e não está vazio
  if (!formConfig.fields || !Array.isArray(formConfig.fields)) {
    console.error('❌ formConfig.fields não é válido:', formConfig.fields);
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-[#161616] border-gray-700">
          <CardContent className="p-8 text-center">
            <p className="text-red-400 text-lg mb-4">
              Erro: Campos do formulário não encontrados
            </p>
            <p className="text-gray-400 text-sm">
              Debug: {JSON.stringify(formConfig.fields)}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ordenar campos por ordem
  const sortedFields = [...formConfig.fields].sort((a, b) => a.order - b.order);
  console.log('📊 Campos ordenados:', sortedFields.map(f => ({ id: f.id, label: f.label, order: f.order })));

  return (
    <div className="max-w-2xl mx-auto px-4">
      <Card className="bg-[#161616] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge className={getCategoryColor(formConfig.category)}>
              {getCategoryLabel(formConfig.category)}
            </Badge>
          </div>
          <CardTitle className="text-white">{formConfig.title}</CardTitle>
          {formConfig.description && (
            <p className="text-gray-400">{formConfig.description}</p>
          )}
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {sortedFields.map((field) => {
              console.log('🔄 Processando campo para renderização:', field.id, field.label);
              return (
                <div key={field.id} className="space-y-2">
                  {field.type !== 'checkbox' && (
                    <Label className="text-sm font-medium text-white">
                      {field.label}
                      {field.required && <span className="text-green-500 ml-1">*</span>}
                    </Label>
                  )}
                  {renderField(field)}
                </div>
              );
            })}

            {sortedFields.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-2">Nenhum campo foi configurado ainda.</p>
                <p className="text-sm">Debug: Total de campos no formConfig: {formConfig.fields?.length || 0}</p>
              </div>
            )}

            {sortedFields.length > 0 && (
              <div className="w-full">
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-base py-3" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Formulário
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
