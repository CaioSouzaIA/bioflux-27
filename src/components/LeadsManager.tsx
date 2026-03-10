
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Download, Search, Users, RotateCcw, Crown, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppPopup } from './WhatsAppPopup';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ClientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
  unlimited_plan_enabled: boolean;
  client_subscriptions?: Array<{
    id: string;
    status: string;
    forms_completed: boolean;
    updated_at: string | null;
  }>;
}

export const LeadsManager: React.FC = () => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ativos' | 'inativos'>('ativos');
  const [loading, setLoading] = useState(true);
  const [resettingClient, setResettingClient] = useState<string | null>(null);
  const [toggleingUnlimited, setToggleingUnlimited] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, statusFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          first_name, 
          last_name, 
          email, 
          whatsapp, 
          created_at,
          unlimited_plan_enabled,
          client_subscriptions(
            id,
            status,
            forms_completed,
            updated_at
          )
        `)
        .eq('user_type', 'client')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar clientes:', error);
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar os dados dos clientes.",
          variant: "destructive",
        });
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Erro inesperado ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    // Filtrar por status (ativos/inativos)
    let statusFiltered = clients.filter(client => {
      const hasActiveSubscription = client.client_subscriptions?.some(sub => sub.status === 'ativo');
      return statusFilter === 'ativos' ? hasActiveSubscription : !hasActiveSubscription;
    });

    // Filtrar por termo de busca
    if (!searchTerm) {
      setFilteredClients(statusFiltered);
      return;
    }

    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = statusFiltered.filter(client => {
      const fullName = `${client.first_name || ''} ${client.last_name || ''}`.toLowerCase();
      const whatsapp = client.whatsapp || '';
      return fullName.includes(lowercasedSearchTerm) || whatsapp.includes(searchTerm);
    });

    setFilteredClients(filtered);
  };

  const handleResetClientForms = async (clientId: string, clientName: string) => {
    try {
      setResettingClient(clientId);
      
      const { data, error } = await supabase
        .rpc('reset_client_forms', { client_user_id: clientId });

      if (error) {
        console.error('Erro ao resetar formulários:', error);
        toast({
          title: "Erro ao resetar",
          description: "Não foi possível resetar os formulários do cliente.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        toast({
          title: "Formulários resetados",
          description: `Os formulários de ${clientName} foram resetados com sucesso.`,
        });
        
        // Recarregar a lista de clientes para atualizar o status
        await loadClients();
      } else {
        toast({
          title: "Nenhuma assinatura encontrada",
          description: "Cliente não possui assinatura ativa para resetar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao resetar formulários:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado ao resetar os formulários.",
        variant: "destructive",
      });
    } finally {
      setResettingClient(null);
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    try {
      setDeletingClient(clientId);

      for (const bucket of ['diet-pdfs', 'avatars'] as const) {
        const { data: objects, error: listError } = await supabase.storage
          .from(bucket)
          .list(clientId, { limit: 1000 });

        if (listError) {
          console.error(`Erro ao listar arquivos do bucket ${bucket}:`, listError);
          toast({
            title: "Erro ao excluir arquivos",
            description: "Não foi possível listar os arquivos do cliente antes da exclusão.",
            variant: "destructive",
          });
          return;
        }

        const pathsToRemove = (objects || [])
          .filter((object) => object.name && object.name !== '.emptyFolderPlaceholder')
          .map((object) => `${clientId}/${object.name}`);

        if (pathsToRemove.length > 0) {
          const { error: removeError } = await supabase.storage
            .from(bucket)
            .remove(pathsToRemove);

          if (removeError) {
            console.error(`Erro ao remover arquivos do bucket ${bucket}:`, removeError);
            toast({
              title: "Erro ao excluir arquivos",
              description: "Não foi possível remover todos os arquivos do cliente.",
              variant: "destructive",
            });
            return;
          }
        }
      }

      const { error } = await supabase.rpc('delete_client_account', {
        target_user_id: clientId,
      });

      if (error) {
        console.error('Erro ao excluir cliente:', error);
        toast({
          title: "Erro ao excluir cliente",
          description: "Não foi possível excluir o cliente e seus dados relacionados.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cliente excluído",
        description: `${clientName} e todos os dados relacionados foram removidos.`,
      });

      await loadClients();
    } catch (error) {
      console.error('Erro inesperado ao excluir cliente:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado ao excluir o cliente.",
        variant: "destructive",
      });
    } finally {
      setDeletingClient(null);
    }
  };

  const sendWebhookNotification = async (planType: string) => {
    try {
      console.log('🔄 Enviando webhook para:', 'https://webhook.n8n1.agenciaevodigital.com/webhook/planoilimitado');
      console.log('📦 Payload:', { plano: planType });
      
      const response = await fetch('https://webhook.n8n1.agenciaevodigital.com/webhook/planoilimitado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          plano: planType
        }),
      });
      
      console.log('📡 Webhook response status:', response.status);
      console.log('📡 Webhook response ok:', response.ok);
      
      if (response.ok) {
        console.log('✅ Webhook enviado com sucesso');
        toast({
          title: "Webhook enviado com sucesso",
          description: "Notificação do plano ilimitado foi enviada.",
        });
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Webhook falhou com status:', response.status, 'Resposta:', errorText);
        toast({
          title: "Erro no webhook",
          description: `Falha ao enviar webhook. Status: ${response.status}`,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar webhook:', error);
      toast({
        title: "Erro no webhook",
        description: "Erro de conexão ao enviar webhook.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleToggleUnlimitedPlan = async (clientId: string, clientName: string, currentStatus: boolean) => {
    try {
      setToggleingUnlimited(clientId);
      
      // Apenas enviar webhook se estiver habilitando o plano ilimitado
      if (!currentStatus) {
        console.log('🚀 Habilitando plano ilimitado para:', clientName);
        const webhookSuccess = await sendWebhookNotification('ilimitado - treino + dieta');
        
        if (webhookSuccess) {
          toast({
            title: "Plano habilitado",
            description: `Plano ilimitado habilitado para ${clientName} e webhook enviado com sucesso.`,
          });
        }
      } else {
        toast({
          title: "Plano desabilitado",
          description: `Plano ilimitado desabilitado para ${clientName}.`,
        });
      }
    } catch (error) {
      console.error('Erro ao processar plano ilimitado:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado ao processar o plano.",
        variant: "destructive",
      });
    } finally {
      setToggleingUnlimited(null);
    }
  };


  const exportToCSV = () => {
    const csvContent = [
      ['Nome', 'Sobrenome', 'Email', 'WhatsApp', 'Data de Cadastro', 'Formulários Completados', 'Plano Ilimitado'],
      ...filteredClients.map(client => [
        client.first_name || '',
        client.last_name || '',
        client.email || '',
        client.whatsapp || '',
        new Date(client.created_at).toLocaleDateString('pt-BR'),
        client.client_subscriptions?.[0]?.forms_completed ? 'Sim' : 'Não',
        client.unlimited_plan_enabled ? 'Habilitado' : 'Desabilitado'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída",
      description: "Os dados dos clientes foram exportados para CSV.",
    });
  };

  const formatWhatsApp = (whatsapp: string | null) => {
    if (!whatsapp) return '';
    const cleaned = whatsapp.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return whatsapp;
  };

  if (loading) {
    return (
      <Card className="client-surface-panel rounded-3xl">
        <CardContent className="p-8">
          <p className="text-center text-white/60">Carregando clientes...</p>
        </CardContent>
      </Card>
    );
  }

  const activeCount = clients.filter((client) => client.client_subscriptions?.some((sub) => sub.status === 'ativo')).length;
  const inactiveCount = clients.length - activeCount;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="client-glass-card" style={{ ['--card-glow' as string]: 'rgba(168,85,247,0.28)' }}>
          <CardContent className="p-6">
            <p className="text-sm text-white/60">Clientes filtrados</p>
            <p className="mt-2 text-3xl font-semibold text-white">{filteredClients.length}</p>
          </CardContent>
        </Card>
        <Card className="client-glass-card" style={{ ['--card-glow' as string]: 'rgba(34,197,94,0.28)' }}>
          <CardContent className="p-6">
            <p className="text-sm text-white/60">Clientes ativos</p>
            <p className="mt-2 text-3xl font-semibold text-white">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="client-glass-card" style={{ ['--card-glow' as string]: 'rgba(239,68,68,0.24)' }}>
          <CardContent className="p-6">
            <p className="text-sm text-white/60">Clientes inativos</p>
            <p className="mt-2 text-3xl font-semibold text-white">{inactiveCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="client-surface-panel rounded-3xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5 text-purple-400" />
                Gerenciar Clientes
              </CardTitle>
              <p className="mt-2 text-sm text-white/60">
                Filtre, exporte e gerencie contas de clientes no mesmo padrão visual do painel.
              </p>
            </div>

            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ativos' | 'inativos')} className="w-full lg:w-auto">
              <TabsList className="client-surface-subtle grid h-auto w-full grid-cols-2 rounded-2xl border border-white/10 p-1 lg:w-[260px]">
                <TabsTrigger value="ativos" className="rounded-xl bg-transparent text-white/60 data-[state=active]:bg-black data-[state=active]:text-white">
                  Ativos
                </TabsTrigger>
                <TabsTrigger value="inativos" className="rounded-xl bg-transparent text-white/60 data-[state=active]:bg-black data-[state=active]:text-white">
                  Inativos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Buscar por nome ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="client-input-surface pl-10 !text-black placeholder:text-black/45"
              />
            </div>
            <Button
              onClick={exportToCSV}
              className="client-action-button w-full lg:w-auto"
              disabled={filteredClients.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="client-surface-subtle rounded-2xl px-6 py-12 text-center text-white/60">
              {searchTerm ? 'Nenhum cliente encontrado com o termo pesquisado.' : 'Nenhum cliente cadastrado ainda.'}
            </div>
          ) : (
            <div className="client-surface-subtle overflow-hidden rounded-2xl border border-white/8">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/8 bg-white/[0.03] hover:bg-white/[0.03]">
                    <TableHead className="text-white/70">Nome Completo</TableHead>
                    <TableHead className="text-white/70">WhatsApp</TableHead>
                    <TableHead className="text-white/70">Data de Cadastro</TableHead>
                    {statusFilter === 'inativos' && (
                      <TableHead className="text-white/70">Data Inativação</TableHead>
                    )}
                    <TableHead className="text-white/70">Status Formulários</TableHead>
                    <TableHead className="text-white/70">Plano Ilimitado</TableHead>
                    <TableHead className="text-white/70">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const activeSub = client.client_subscriptions?.find(sub => sub.status === 'ativo');
                    const inactiveSub = client.client_subscriptions?.find(sub => sub.status !== 'ativo');
                    const formsCompleted = activeSub?.forms_completed || false;
                    const clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim();

                    return (
                      <TableRow key={client.id} className="border-white/8 bg-transparent hover:bg-white/[0.03]">
                        <TableCell className="font-medium text-white">{clientName}</TableCell>
                        <TableCell className="text-white/80">{formatWhatsApp(client.whatsapp)}</TableCell>
                        <TableCell className="text-white/60">
                          {new Date(client.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        {statusFilter === 'inativos' && (
                          <TableCell className="text-white/60">
                            {inactiveSub?.updated_at ? new Date(inactiveSub.updated_at).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                        )}
                        <TableCell>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                            formsCompleted
                              ? 'border-red-500/30 bg-red-500/10 text-red-300'
                              : 'border-green-500/30 bg-green-500/10 text-green-300'
                          }`}>
                            {formsCompleted ? 'Completados' : 'Disponíveis'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                              client.unlimited_plan_enabled
                                ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                                : 'border-white/10 bg-white/5 text-white/60'
                            }`}>
                              {client.unlimited_plan_enabled ? 'Habilitado' : 'Desabilitado'}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleUnlimitedPlan(client.id, clientName, client.unlimited_plan_enabled)}
                              disabled={toggleingUnlimited === client.id}
                              className="client-back-button h-9 px-3 text-xs"
                            >
                              {toggleingUnlimited === client.id ? (
                                'Alterando...'
                              ) : (
                                <>
                                  <Crown className="w-4 h-4 mr-1" />
                                  {client.unlimited_plan_enabled ? 'Desabilitar' : 'Habilitar'}
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <WhatsAppPopup leadWhatsApp={client.whatsapp || ''} leadName={clientName} />
                            {formsCompleted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetClientForms(client.id, clientName)}
                                disabled={resettingClient === client.id}
                                className="client-back-button h-9 px-3 text-xs"
                              >
                                {resettingClient === client.id ? (
                                  'Resetando...'
                                ) : (
                                  <>
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Reset
                                  </>
                                )}
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={deletingClient === client.id}
                                  className="h-9 border-red-500/30 bg-red-500/8 px-3 text-xs text-red-300 hover:bg-red-500/16 hover:text-red-200"
                                >
                                  {deletingClient === client.id ? (
                                    'Excluindo...'
                                  ) : (
                                    <>
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Excluir
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="client-surface-panel rounded-3xl text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir cliente permanentemente?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-white/65">
                                    Esta ação remove {clientName || 'este cliente'}, a conta de acesso e todos os dados relacionados em cascata.
                                    Essa operação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="client-back-button">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteClient(client.id, clientName)}
                                    className="border border-red-500/30 bg-red-500/12 text-red-200 hover:bg-red-500/22"
                                  >
                                    Excluir definitivamente
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
