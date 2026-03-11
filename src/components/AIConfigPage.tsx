import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bot, FileCode2, GitCommitHorizontal, History, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import ProfileDropdown from '@/components/ProfileDropdown';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AI_AGENT_DEFINITIONS, type AIAgentKey, type PromptFormat } from '@/lib/ai-agent-prompts';
import type { Database } from '@/integrations/supabase/types';

interface AIConfigFormData {
  professionalName: string;
  personalName: string;
  crn: string;
  cref: string;
  sendingTime: string;
  feedbackCollection: string;
  feedbackInterval: string;
  [key: string]: string;
}

interface AIConfigPageProps {
  onBack: () => void;
}

type PromptVersionRow = Database['public']['Tables']['ai_agent_prompt_versions']['Row'];

const EMPTY_CONFIG: AIConfigFormData = {
  professionalName: '',
  personalName: '',
  crn: '',
  cref: '',
  sendingTime: '',
  feedbackCollection: '',
  feedbackInterval: '',
};

const FIELD_CLASS = 'client-input-surface !text-white placeholder:text-white/35';
const TEXTAREA_CLASS = 'min-h-[420px] achievements-config-input resize-none font-mono text-sm leading-6';

const sendingTimes = [
  { value: 'imediato', label: 'Imediato' },
  { value: '30min', label: '30 minutos' },
  { value: '1h', label: '1 hora' },
  { value: '6h', label: '6 horas' },
  { value: '12h', label: '12 horas' },
  { value: '24h', label: '24 horas' },
  { value: '48h', label: '48 horas' },
];

const feedbackDays = [
  { value: 'segunda-feira', label: 'Segunda-feira' },
  { value: 'terça-feira', label: 'Terça-feira' },
  { value: 'quarta-feira', label: 'Quarta-feira' },
  { value: 'quinta-feira', label: 'Quinta-feira' },
  { value: 'sexta-feira', label: 'Sexta-feira' },
  { value: 'sábado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

const feedbackIntervals = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
];

const loadFromLocalStorage = (): AIConfigFormData => {
  try {
    const savedConfig = localStorage.getItem('aiConfig');
    return savedConfig ? JSON.parse(savedConfig) : EMPTY_CONFIG;
  } catch {
    return EMPTY_CONFIG;
  }
};

export const AIConfigPage: React.FC<AIConfigPageProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [selectedAgentKey, setSelectedAgentKey] = useState<AIAgentKey>('diet_generation');
  const [promptDraft, setPromptDraft] = useState('');
  const [promptFormat, setPromptFormat] = useState<PromptFormat>('markdown');
  const [commitName, setCommitName] = useState('');

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<AIConfigFormData>({
    defaultValues: EMPTY_CONFIG,
  });

  const { data: aiConfigData } = useQuery({
    queryKey: ['ai-config', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('ai_config')
        .eq('id', user!.id)
        .single();

      if (error) {
        throw error;
      }

      return (data?.ai_config as AIConfigFormData | null) ?? null;
    },
  });

  const { data: promptVersions = [] } = useQuery({
    queryKey: ['ai-agent-prompt-versions'],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agent_prompt_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as PromptVersionRow[];
    },
  });

  useEffect(() => {
    const nextValues = aiConfigData ?? loadFromLocalStorage();
    reset({ ...EMPTY_CONFIG, ...nextValues });
  }, [aiConfigData, reset]);

  const promptVersionsByAgent = useMemo(() => {
    const map = new Map<AIAgentKey, PromptVersionRow[]>();
    for (const agent of AI_AGENT_DEFINITIONS) {
      map.set(agent.key, promptVersions.filter((version) => version.agent_key === agent.key));
    }
    return map;
  }, [promptVersions]);

  const selectedAgent = AI_AGENT_DEFINITIONS.find((agent) => agent.key === selectedAgentKey) ?? AI_AGENT_DEFINITIONS[0];
  const selectedAgentVersions = promptVersionsByAgent.get(selectedAgentKey) ?? [];
  const activePromptVersion = selectedAgentVersions.find((version) => version.is_active) ?? null;

  useEffect(() => {
    if (!isPromptModalOpen) return;
    setPromptDraft(activePromptVersion?.prompt_content ?? selectedAgent.defaultPrompt);
    setPromptFormat((activePromptVersion?.prompt_format as PromptFormat | undefined) ?? selectedAgent.defaultFormat);
    setCommitName('');
  }, [isPromptModalOpen, selectedAgent, activePromptVersion]);

  const saveConfigMutation = useMutation({
    mutationFn: async (data: AIConfigFormData) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ ai_config: data as unknown as Database['public']['Tables']['profiles']['Update']['ai_config'] })
        .eq('id', user.id);

      if (error) throw error;
      localStorage.setItem('aiConfig', JSON.stringify(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações do bot foram atualizadas com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Não foi possível salvar as configurações do bot.',
        variant: 'destructive',
      });
    },
  });

  const savePromptMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado.');
      }

      const trimmedCommit = commitName.trim();
      const trimmedPrompt = promptDraft.trim();

      if (!trimmedCommit) {
        throw new Error('Informe o nome do commit do prompt.');
      }

      if (!trimmedPrompt) {
        throw new Error('O prompt não pode ficar vazio.');
      }

      await supabase
        .from('ai_agent_prompt_versions')
        .update({ is_active: false })
        .eq('agent_key', selectedAgentKey)
        .eq('is_active', true);

      const { error } = await supabase
        .from('ai_agent_prompt_versions')
        .insert({
          agent_key: selectedAgent.key,
          agent_label: selectedAgent.label,
          commit_name: trimmedCommit,
          prompt_content: trimmedPrompt,
          prompt_format: promptFormat,
          is_active: true,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ai-agent-prompt-versions'] });
      setCommitName('');
      toast({
        title: 'Prompt versionado',
        description: `Novo commit salvo para ${selectedAgent.label}.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar prompt:', error);
      toast({
        title: 'Erro ao salvar prompt',
        description: error instanceof Error ? error.message : 'Não foi possível versionar esse prompt.',
        variant: 'destructive',
      });
    },
  });

  const restorePromptMutation = useMutation({
    mutationFn: async (versionId: string) => {
      await supabase
        .from('ai_agent_prompt_versions')
        .update({ is_active: false })
        .eq('agent_key', selectedAgentKey)
        .eq('is_active', true);

      const { error } = await supabase
        .from('ai_agent_prompt_versions')
        .update({ is_active: true })
        .eq('id', versionId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ai-agent-prompt-versions'] });
      toast({
        title: 'Prompt restaurado',
        description: `O commit selecionado voltou a ser o ativo para ${selectedAgent.label}.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao restaurar prompt:', error);
      toast({
        title: 'Erro ao restaurar',
        description: error instanceof Error ? error.message : 'Não foi possível restaurar esse commit.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AIConfigFormData) => {
    saveConfigMutation.mutate(data);
  };

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />

      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 pt-8">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onBack} className="client-back-button">
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

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-white">Configurações do Bot</h1>
            <p className="mt-2 text-white/60">
              Ajuste identidade profissional, cadência operacional e versionamento dos prompts usados pelos agentes.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr] mb-8">
            <Card className="client-glass-card" style={{ ['--card-glow' as string]: 'rgba(249,115,22,0.28)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bot className="h-5 w-5 text-orange-400" />
                  Núcleo do Bot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-white/65">
                <p>Configure os nomes profissionais, registros e a rotina de feedback usada na operação.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                    IA Config
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                    Prompts versionados
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                    Logs por commit
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="client-glass-card" style={{ ['--card-glow' as string]: 'rgba(34,211,238,0.26)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-cyan-300" />
                  Prompts
                </CardTitle>
              </CardHeader>
              <CardContent className="flex h-full flex-col justify-between gap-4">
                <div className="space-y-2 text-sm text-white/65">
                  <p>{promptVersions.length} versão(ões) registradas para os agentes ativos.</p>
                  <p>{AI_AGENT_DEFINITIONS.length} agentes configuráveis: dieta, treino e periodização.</p>
                </div>
                <Button type="button" onClick={() => setIsPromptModalOpen(true)} className="client-action-button w-full">
                  <FileCode2 className="mr-2 h-4 w-4" />
                  Prompts
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="client-surface-panel rounded-3xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-orange-400" />
                Configuração operacional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="professionalName" className="text-cyan-300 font-semibold">
                    Nome do Profissional - Nutricionista *
                  </Label>
                  <Input
                    id="professionalName"
                    {...register('professionalName', { required: 'Nome é obrigatório' })}
                    className={FIELD_CLASS}
                    placeholder="Digite o nome do nutricionista"
                  />
                  {errors.professionalName && <p className="text-red-400 text-sm">{errors.professionalName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personalName" className="text-cyan-300 font-semibold">
                    Nome do Profissional - Personal *
                  </Label>
                  <Input
                    id="personalName"
                    {...register('personalName', { required: 'Nome do personal é obrigatório' })}
                    className={FIELD_CLASS}
                    placeholder="Digite o nome do personal trainer"
                  />
                  {errors.personalName && <p className="text-red-400 text-sm">{errors.personalName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crn" className="text-cyan-300 font-semibold">
                    CRN do Profissional *
                  </Label>
                  <Input
                    id="crn"
                    {...register('crn', { required: 'CRN é obrigatório' })}
                    className={FIELD_CLASS}
                    placeholder="Digite o CRN do nutricionista"
                  />
                  {errors.crn && <p className="text-red-400 text-sm">{errors.crn.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cref" className="text-cyan-300 font-semibold">
                    CREF do Profissional *
                  </Label>
                  <Input
                    id="cref"
                    {...register('cref', { required: 'CREF é obrigatório' })}
                    className={FIELD_CLASS}
                    placeholder="Digite o CREF do personal trainer"
                  />
                  {errors.cref && <p className="text-red-400 text-sm">{errors.cref.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-cyan-300 font-semibold">Tempo de Envio *</Label>
                  <Select value={watch('sendingTime')} onValueChange={(value) => setValue('sendingTime', value, { shouldDirty: true })}>
                    <SelectTrigger className="client-input-surface text-white">
                      <SelectValue placeholder="Selecione o tempo de envio" />
                    </SelectTrigger>
                    <SelectContent>
                      {sendingTimes.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-cyan-300 font-semibold">Coleta de Feedback</Label>
                  <Select value={watch('feedbackCollection')} onValueChange={(value) => setValue('feedbackCollection', value, { shouldDirty: true })}>
                    <SelectTrigger className="client-input-surface text-white">
                      <SelectValue placeholder="Selecione o dia da semana" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackDays.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-cyan-300 font-semibold">Intervalo de Envio de Feedback</Label>
                  <Select value={watch('feedbackInterval')} onValueChange={(value) => setValue('feedbackInterval', value, { shouldDirty: true })}>
                    <SelectTrigger className="client-input-surface text-white">
                      <SelectValue placeholder="Selecione o intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackIntervals.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-4 pt-2 lg:col-span-2">
                  <Button type="submit" disabled={saveConfigMutation.isPending} className="client-action-button">
                    <Save className="w-4 h-4 mr-2" />
                    {saveConfigMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                  <Button type="button" variant="outline" onClick={onBack} className="client-back-button">
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isPromptModalOpen} onOpenChange={setIsPromptModalOpen}>
        <DialogContent className="max-h-[92vh] max-w-7xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white">Prompts dos agentes</DialogTitle>
            <DialogDescription>
              Edite os agentes de dieta, treino e periodização. Cada salvamento cria uma nova versão com nome de commit.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-3 border-b border-white/8 pb-4">
            {AI_AGENT_DEFINITIONS.map((agent) => (
              <Button
                key={agent.key}
                type="button"
                onClick={() => setSelectedAgentKey(agent.key)}
                className={selectedAgentKey === agent.key ? 'client-action-button' : 'client-back-button'}
              >
                {agent.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="achievements-config-subtle rounded-3xl p-5">
                <h3 className="text-lg font-semibold text-white">{selectedAgent.label}</h3>
                <p className="mt-2 text-sm text-white/60">{selectedAgent.description}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <div className="space-y-2">
                  <Label className="text-white">Formato</Label>
                  <Select value={promptFormat} onValueChange={(value) => setPromptFormat(value as PromptFormat)}>
                    <SelectTrigger className="client-input-surface text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Nome do commit</Label>
                  <Input
                    value={commitName}
                    onChange={(event) => setCommitName(event.target.value)}
                    className={FIELD_CLASS}
                    placeholder="Ex: refine-training-volume-v2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Prompt</Label>
                <Textarea
                  value={promptDraft}
                  onChange={(event) => setPromptDraft(event.target.value)}
                  className={TEXTAREA_CLASS}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => savePromptMutation.mutate()} disabled={savePromptMutation.isPending} className="client-action-button">
                  <Save className="mr-2 h-4 w-4" />
                  {savePromptMutation.isPending ? 'Salvando...' : 'Salvar nova versão'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setPromptDraft(activePromptVersion?.prompt_content ?? selectedAgent.defaultPrompt);
                    setPromptFormat((activePromptVersion?.prompt_format as PromptFormat | undefined) ?? selectedAgent.defaultFormat);
                    setCommitName('');
                  }}
                  className="client-back-button"
                >
                  Resetar rascunho
                </Button>
              </div>
            </div>

            <aside className="achievements-config-subtle rounded-3xl p-5">
              <div className="flex items-center gap-2 text-white">
                <History className="h-4 w-4 text-cyan-300" />
                <h3 className="font-semibold">Logs</h3>
              </div>
              <p className="mt-2 text-sm text-white/55">
                Clique em um commit para restaurar aquela versão como prompt ativo.
              </p>

              <div className="mt-4 space-y-3 max-h-[58vh] overflow-y-auto pr-1">
                {selectedAgentVersions.length > 0 ? (
                  selectedAgentVersions.map((version) => (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => {
                        setPromptDraft(version.prompt_content);
                        setPromptFormat(version.prompt_format as PromptFormat);
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                        version.is_active
                          ? 'border-cyan-400/35 bg-cyan-400/10'
                          : 'border-white/8 bg-white/[0.03] hover:border-white/14'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <GitCommitHorizontal className="h-4 w-4 text-cyan-300" />
                            {version.commit_name}
                          </div>
                          <p className="mt-2 text-xs text-white/45">
                            {new Date(version.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        {version.is_active ? (
                          <span className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">
                            Ativo
                          </span>
                        ) : (
                          <Button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              restorePromptMutation.mutate(version.id);
                            }}
                            disabled={restorePromptMutation.isPending}
                            className="client-back-button h-8 px-3 text-xs"
                          >
                            Restaurar
                          </Button>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/55">
                    Nenhum commit salvo ainda para este agente.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

