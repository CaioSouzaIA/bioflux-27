
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Save, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AuthHeader from '@/components/AuthHeader';

interface AIConfigFormData {
  professionalName: string;
  personalName: string;
  crn: string;
  cref: string;
  sendingTime: string;
  feedbackCollection: string;
  feedbackInterval: string;
  [key: string]: string; // Add index signature for Json compatibility
}

interface AIConfigPageProps {
  onBack: () => void;
}

export const AIConfigPage: React.FC<AIConfigPageProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { user } = useAuthContext();
  
  // Carregar configurações salvas do Supabase ou localStorage
  const loadSavedConfig = async () => {
    try {
      if (user) {
        // Tentar carregar do Supabase primeiro
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('ai_config')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao carregar configurações do Supabase:', error);
          return loadFromLocalStorage();
        }

        if (profile?.ai_config) {
          console.log('Configurações carregadas do Supabase:', profile.ai_config);
          return profile.ai_config as AIConfigFormData;
        }
      }
      
      return loadFromLocalStorage();
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      return loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = (): AIConfigFormData => {
    try {
      const savedConfig = localStorage.getItem('aiConfig');
      return savedConfig ? JSON.parse(savedConfig) : {
        professionalName: '',
        personalName: '',
        crn: '',
        cref: '',
        sendingTime: '',
        feedbackCollection: '',
        feedbackInterval: ''
      };
    } catch (error) {
      return {
        professionalName: '',
        personalName: '',
        crn: '',
        cref: '',
        sendingTime: '',
        feedbackCollection: '',
        feedbackInterval: ''
      };
    }
  };

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AIConfigFormData>({
    defaultValues: async () => await loadSavedConfig()
  });

  const sendingTimes = [
    { value: 'imediato', label: 'Imediato' },
    { value: '30min', label: '30 minutos' },
    { value: '1h', label: '1 hora' },
    { value: '6h', label: '6 horas' },
    { value: '12h', label: '12 horas' },
    { value: '24h', label: '24 horas' },
    { value: '48h', label: '48 horas' }
  ];

  const feedbackDays = [
    { value: 'segunda-feira', label: 'Segunda-feira' },
    { value: 'terça-feira', label: 'Terça-feira' },
    { value: 'quarta-feira', label: 'Quarta-feira' },
    { value: 'quinta-feira', label: 'Quinta-feira' },
    { value: 'sexta-feira', label: 'Sexta-feira' },
    { value: 'sábado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  const feedbackIntervals = [
    { value: 'semanal', label: 'Semanal' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral', label: 'Semestral' }
  ];

  const onSubmit = async (data: AIConfigFormData) => {
    try {
      // Salvar no Supabase se usuário estiver logado
      if (user) {
        console.log('Salvando configurações no Supabase para usuário:', user.id);
        
        const { error } = await supabase
          .from('profiles')
          .update({ ai_config: data as any }) // Type assertion para Json
          .eq('id', user.id);

        if (error) {
          console.error('Erro ao salvar no Supabase:', error);
          // Fallback para localStorage
          localStorage.setItem('aiConfig', JSON.stringify(data));
          
          toast({
            title: "Configurações Salvas Localmente",
            description: "Erro ao salvar no banco de dados. Configurações salvas localmente.",
            variant: "destructive",
          });
          return;
        }

        console.log('Configurações salvas no Supabase com sucesso');
      }
      
      // Sempre salvar no localStorage como backup
      localStorage.setItem('aiConfig', JSON.stringify(data));
      
      console.log('Configurações da IA salvas:', data);
      
      toast({
        title: "Configurações Salvas!",
        description: "As configurações da IA foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      
      // Fallback para localStorage
      localStorage.setItem('aiConfig', JSON.stringify(data));
      
      toast({
        title: "Erro ao Salvar",
        description: "Houve um problema ao salvar no banco. Salvo localmente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black transition-colors duration-300">
      <AuthHeader />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="client-back-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
            <img 
              src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
              alt="BIOFLUX.AI" 
              className="h-12"
            />
            <div className="w-[100px]"></div>
          </div>

          <Card className="client-surface-panel rounded-3xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-orange-500" />
                Configurações do Bot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="professionalName" className="text-cyan-500 font-semibold">
                    Nome do Profissional - Nutricionista *
                  </Label>
                  <Input
                    id="professionalName"
                    {...register('professionalName', { required: 'Nome é obrigatório' })}
                    className="client-input-surface !text-black placeholder:text-black/45"
                    placeholder="Digite o nome do nutricionista"
                  />
                  {errors.professionalName && (
                    <p className="text-red-400 text-sm">{errors.professionalName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personalName" className="text-cyan-500 font-semibold">
                    Nome do Profissional - Personal *
                  </Label>
                  <Input
                    id="personalName"
                    {...register('personalName', { required: 'Nome do personal é obrigatório' })}
                    className="client-input-surface !text-black placeholder:text-black/45"
                    placeholder="Digite o nome do personal trainer"
                  />
                  {errors.personalName && (
                    <p className="text-red-400 text-sm">{errors.personalName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crn" className="text-cyan-500 font-semibold">
                    CRN do Profissional *
                  </Label>
                  <Input
                    id="crn"
                    {...register('crn', { required: 'CRN é obrigatório' })}
                    className="client-input-surface !text-black placeholder:text-black/45"
                    placeholder="Digite o CRN do nutricionista"
                  />
                  {errors.crn && (
                    <p className="text-red-400 text-sm">{errors.crn.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cref" className="text-cyan-500 font-semibold">
                    CREF do Profissional *
                  </Label>
                  <Input
                    id="cref"
                    {...register('cref', { required: 'CREF é obrigatório' })}
                    className="client-input-surface !text-black placeholder:text-black/45"
                    placeholder="Digite o CREF do personal trainer"
                  />
                  {errors.cref && (
                    <p className="text-red-400 text-sm">{errors.cref.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-cyan-500 font-semibold">
                    Tempo de Envio *
                  </Label>
                  <Select onValueChange={(value) => setValue('sendingTime', value)}>
                    <SelectTrigger className="client-input-surface text-white">
                      <SelectValue placeholder="Selecione o tempo de envio" />
                    </SelectTrigger>
                    <SelectContent className="text-white">
                      {sendingTimes.map((time) => (
                        <SelectItem 
                          key={time.value} 
                          value={time.value}
                          className="text-white hover:bg-gray-700"
                        >
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-cyan-500 font-semibold">
                    Coleta de Feedback
                  </Label>
                  <Select onValueChange={(value) => setValue('feedbackCollection', value)}>
                    <SelectTrigger className="client-input-surface text-white">
                      <SelectValue placeholder="Selecione o dia da semana" />
                    </SelectTrigger>
                    <SelectContent className="text-white">
                      {feedbackDays.map((day) => (
                        <SelectItem 
                          key={day.value} 
                          value={day.value}
                          className="text-white hover:bg-gray-700"
                        >
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-cyan-500 font-semibold">
                    Intervalo de Envio de Feedback
                  </Label>
                  <Select onValueChange={(value) => setValue('feedbackInterval', value)}>
                    <SelectTrigger className="client-input-surface text-white">
                      <SelectValue placeholder="Selecione o intervalo" />
                    </SelectTrigger>
                    <SelectContent className="text-white">
                      {feedbackIntervals.map((interval) => (
                        <SelectItem 
                          key={interval.value} 
                          value={interval.value}
                          className="text-white hover:bg-gray-700"
                        >
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button 
                    type="submit" 
                    className="client-action-button flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Configurações
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onBack}
                    className="client-back-button"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
