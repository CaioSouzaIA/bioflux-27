import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, FileCode2, GitCommitHorizontal, History, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import ProfileDropdown from '@/components/ProfileDropdown';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AI_AGENT_DEFINITIONS, type AIAgentKey, type PromptFormat } from '@/lib/ai-agent-prompts';
import type { Database } from '@/integrations/supabase/types';

interface AIConfigPageProps {
  onBack: () => void;
}

type PromptVersionRow = Database['public']['Tables']['ai_agent_prompt_versions']['Row'];
type AIAgentExecutionLogRow = Database['public']['Tables']['ai_agent_execution_logs']['Row'];
const FIELD_CLASS = 'client-input-surface !text-white placeholder:text-white/35';
const TEXTAREA_CLASS = 'min-h-[420px] achievements-config-input resize-none font-mono text-sm leading-6';
const CARD_GLOWS = [
  'rgba(34,211,238,0.26)',
  'rgba(249,115,22,0.26)',
  'rgba(239,68,68,0.24)',
];

export const AIConfigPage: React.FC<AIConfigPageProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [selectedAgentKey, setSelectedAgentKey] = useState<AIAgentKey>('diet_generation');
  const [promptDraft, setPromptDraft] = useState('');
  const [promptFormat, setPromptFormat] = useState<PromptFormat>('markdown');
  const [commitName, setCommitName] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [logAgentFilter, setLogAgentFilter] = useState<'all' | AIAgentKey>('all');

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

  const { data: executionLogs = [] } = useQuery({
    queryKey: ['ai-agent-execution-logs'],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agent_execution_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      return (data ?? []) as AIAgentExecutionLogRow[];
    },
  });

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
  const totalPromptVersions = promptVersions.length;
  const filteredExecutionLogs = useMemo(
    () =>
      executionLogs.filter((log) => {
        const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;
        const matchesAgent = logAgentFilter === 'all' || log.agent_key === logAgentFilter;
        return matchesStatus && matchesAgent;
      }),
    [executionLogs, logAgentFilter, logStatusFilter]
  );
  const successLogsCount = executionLogs.filter((log) => log.status === 'success').length;
  const failedLogsCount = executionLogs.filter((log) => log.status === 'failed').length;
  const averageDurationMs = executionLogs.length
    ? Math.round(
        executionLogs.reduce((total, log) => total + (log.duration_ms ?? 0), 0) / executionLogs.length
      )
    : 0;

  useEffect(() => {
    if (!isPromptModalOpen) return;
    setPromptDraft(activePromptVersion?.prompt_content ?? selectedAgent.defaultPrompt);
    setPromptFormat((activePromptVersion?.prompt_format as PromptFormat | undefined) ?? selectedAgent.defaultFormat);
    setCommitName('');
  }, [isPromptModalOpen, selectedAgent, activePromptVersion]);

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
              Ajuste os prompts e o versionamento dos agentes ativos de dieta, treino, readaptação e periodização.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 mb-8">
            <Card
              className="client-glass-card"
              style={{ ['--card-glow' as string]: 'rgba(255,255,255,0.18)' }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-white" />
                  Versionamento
                </CardTitle>
              </CardHeader>
              <CardContent className="flex h-full flex-col justify-between gap-4">
                <div className="space-y-2 text-sm text-white/65">
                  <p>{AI_AGENT_DEFINITIONS.length} agentes dinâmicos ativos.</p>
                  <p>{totalPromptVersions} commit(s) registrados no total.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                  Use os cards dos agentes para abrir o modal com logs e restauração.
                </div>
              </CardContent>
            </Card>

            {AI_AGENT_DEFINITIONS.map((agent, index) => {
              const versions = promptVersionsByAgent.get(agent.key) ?? [];
              const activeVersion = versions.find((version) => version.is_active) ?? null;

              return (
                <Card
                  key={agent.key}
                  className="client-glass-card cursor-pointer transition-transform duration-300 hover:scale-[1.01]"
                  style={{ ['--card-glow' as string]: CARD_GLOWS[index % CARD_GLOWS.length] }}
                  onClick={() => {
                    setSelectedAgentKey(agent.key);
                    setIsPromptModalOpen(true);
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <FileCode2 className="h-5 w-5 text-cyan-300" />
                      {agent.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex h-full flex-col justify-between gap-4">
                    <div className="space-y-2 text-sm text-white/65">
                      <p>{agent.description}</p>
                      <p>Commit ativo: <span className="text-white/90">{activeVersion?.commit_name ?? 'Padrão inicial'}</span></p>
                      <p>{versions.length} versão(ões) registrada(s).</p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedAgentKey(agent.key);
                        setIsPromptModalOpen(true);
                      }}
                      className="client-action-button w-full"
                    >
                      <FileCode2 className="mr-2 h-4 w-4" />
                      Abrir prompt
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="client-glass-card" style={{ ['--card-glow' as string]: 'rgba(239,68,68,0.18)' }}>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Activity className="h-5 w-5 text-cyan-300" />
                    Logs de Performance
                  </CardTitle>
                  <p className="mt-2 text-sm text-white/60">
                    Registro persistente das execuções dos agentes, com sucesso e falha, para facilitar o diagnóstico das gerações.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      Sucessos
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">{successLogsCount}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <AlertTriangle className="h-4 w-4 text-red-300" />
                      Falhas
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">{failedLogsCount}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="text-sm text-white/60">Média de duração</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{averageDurationMs} ms</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => setLogStatusFilter('all')}
                    className={logStatusFilter === 'all' ? 'client-action-button' : 'client-back-button'}
                  >
                    Todos
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setLogStatusFilter('failed')}
                    className={logStatusFilter === 'failed' ? 'client-action-button' : 'client-back-button'}
                  >
                    Failed
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setLogStatusFilter('success')}
                    className={logStatusFilter === 'success' ? 'client-action-button' : 'client-back-button'}
                  >
                    Sucesso
                  </Button>
                </div>

                <div className="w-full lg:w-[280px]">
                  <Select value={logAgentFilter} onValueChange={(value) => setLogAgentFilter(value as 'all' | AIAgentKey)}>
                    <SelectTrigger className="client-input-surface text-white">
                      <SelectValue placeholder="Filtrar agente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os agentes</SelectItem>
                      {AI_AGENT_DEFINITIONS.map((agent) => (
                        <SelectItem key={agent.key} value={agent.key}>
                          {agent.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {filteredExecutionLogs.length > 0 ? (
                  filteredExecutionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${
                                log.status === 'success'
                                  ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200'
                                  : 'border-red-400/35 bg-red-400/10 text-red-200'
                              }`}
                            >
                              {log.status}
                            </span>
                            <span className="text-sm font-medium text-white">{log.agent_label}</span>
                            <span className="text-xs text-white/45">{log.source_function}</span>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
                            <span>Stage: {log.stage}</span>
                            <span>Modelo: {log.model_slug ?? 'n/a'}</span>
                            <span>Duração: {log.duration_ms ?? 0} ms</span>
                            <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                            <span>Prompt: {log.prompt_commit_name ?? 'padrão'}</span>
                            {log.secondary_prompt_commit_name && (
                              <span>Análise: {log.secondary_prompt_commit_name}</span>
                            )}
                            {log.prescription_id && <span>Prescrição: {log.prescription_id}</span>}
                          </div>

                          {log.error_message && (
                            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-100">
                              {log.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/55">
                    Nenhum log encontrado para os filtros selecionados.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isPromptModalOpen} onOpenChange={setIsPromptModalOpen}>
        <DialogContent className="max-h-[92vh] max-w-7xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white">Prompts dos agentes</DialogTitle>
            <DialogDescription>
              Edite os agentes de dieta, treino, readaptação e periodização. Cada salvamento cria uma nova versão com nome de commit.
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
                <div className="text-white text-sm font-medium">Formato</div>
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
                  <div className="text-white text-sm font-medium">Nome do commit</div>
                  <Input
                    value={commitName}
                    onChange={(event) => setCommitName(event.target.value)}
                    className={FIELD_CLASS}
                    placeholder="Ex: refine-training-volume-v2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-white text-sm font-medium">Prompt</div>
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
