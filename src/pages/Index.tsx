import React, { useState } from 'react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { FormsList } from '@/components/FormsList';
import { LeadsManager } from '@/components/LeadsManager';
import { AIConfigPage } from '@/components/AIConfigPage';
import { ManagementDashboard } from '@/components/ManagementDashboard';
import { AchievementsConfigPage } from '@/components/AchievementsConfigPage';
import { FormConfig } from '@/types/form';
import { useFormManager } from '@/hooks/useFormManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, Bot, BarChart, ArrowLeft, Trophy } from 'lucide-react';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import ProfileDropdown from '@/components/ProfileDropdown';

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'forms-list' | 'edit-form' | 'leads' | 'ai-config' | 'management' | 'achievements-config'>('home');
  const { forms, setCurrentFormId, createForm, updateForm, deleteForm, getCurrentForm } = useFormManager();
  const adminCardClassName = 'client-glass-card mx-auto flex h-full min-h-[26rem] w-full max-w-sm cursor-pointer flex-col transition-all duration-500 hover:-translate-y-1 hover:scale-[1.01]';
  const adminCardHeaderClassName = 'p-4 pb-4 text-center sm:p-5 sm:pb-5 lg:p-6 lg:pb-6';
  const adminCardTitleClassName = 'mb-2 min-h-[3.5rem] text-lg leading-tight text-white sm:text-xl lg:mb-4 lg:min-h-[4rem] lg:text-2xl flex items-center justify-center text-balance';
  const adminCardContentClassName = 'flex flex-1 flex-col justify-between p-4 pt-0 text-center sm:p-5 lg:p-6';
  const adminCardBodyClassName = 'mb-5 min-h-[7.5rem] text-sm leading-relaxed text-gray-300 sm:text-base lg:mb-8 lg:min-h-[10rem] lg:text-lg';
  const adminCardButtonClassName = 'client-action-button mx-auto flex min-h-12 w-full max-w-[15rem] whitespace-normal rounded-xl px-4 py-3 text-center text-sm leading-tight transition-all duration-300 sm:max-w-[16rem] sm:text-base lg:min-h-14 lg:text-lg';

  const currentForm = getCurrentForm();

  const handleCreateForm = (category: 'anamnese-dieta' | 'feedback' | 'livre' | 'anamnese-treino' | 'anamnese-suplementacao' = 'livre') => {
    createForm(category);
    setCurrentView('edit-form');
  };

  const handleSelectForm = (formId: string) => {
    setCurrentFormId(formId);
    setCurrentView('edit-form');
  };

  const handleFormConfigChange = (config: FormConfig) => {
    if (config.id) {
      updateForm(config.id, config);
    }
  };

  const renderAdminShell = (
    content: React.ReactNode,
    options?: {
      maxWidthClassName?: string;
      backTarget?: 'home' | 'forms-list';
    }
  ) => {
    const maxWidthClassName = options?.maxWidthClassName || 'max-w-6xl';

    return (
      <div className="min-h-screen relative bg-black overflow-hidden">
        <BackgroundAnimation />
        <div className="relative z-10 min-h-screen p-4">
          <div className={`${maxWidthClassName} mx-auto`}>
            <div className="flex items-center justify-between mb-8 pt-8">
              <div className="flex items-center gap-3">
                {options?.backTarget && (
                  <Button variant="outline" onClick={() => setCurrentView(options.backTarget!)} className="client-back-button">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                )}
                <img
                  src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png"
                  alt="BIOFLUX.AI"
                  className="h-10"
                />
              </div>

              <ProfileDropdown />
            </div>

            {content}
          </div>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />

      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 pt-8">
            <img
              src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png"
              alt="BIOFLUX.AI"
              className="h-10"
            />

            <ProfileDropdown />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-white">Painel administrativo</h1>
            <p className="mt-2 text-white/60">
              Gerencie IA, formulários, leads e métricas no mesmo sistema visual da área do cliente.
            </p>
          </div>

          <div className="mx-auto mb-12 grid max-w-7xl grid-cols-1 gap-4 px-2 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3 2xl:grid-cols-5">
            <Card className={`${adminCardClassName} hover:border-orange-500/30`} style={{ ['--card-glow' as string]: 'rgba(249,115,22,0.30)' }} onClick={() => setCurrentView('ai-config')}>
              <CardHeader className={adminCardHeaderClassName}>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/30 sm:h-16 sm:w-16 lg:mb-6 lg:h-20 lg:w-20">
                  <Bot className="h-7 w-7 text-orange-500 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
                </div>
                <CardTitle className={adminCardTitleClassName}>Configurações da IA</CardTitle>
              </CardHeader>
              <CardContent className={adminCardContentClassName}>
                <p className={adminCardBodyClassName}>
                  Configure o bot de IA para prescrições personalizadas de dietas.
                </p>
                <Button className={adminCardButtonClassName}>
                  Configurar IA
                </Button>
              </CardContent>
            </Card>

            <Card className={`${adminCardClassName} hover:border-green-500/30`} style={{ ['--card-glow' as string]: 'rgba(34,197,94,0.30)' }} onClick={() => setCurrentView('forms-list')}>
              <CardHeader className={adminCardHeaderClassName}>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/30 sm:h-16 sm:w-16 lg:mb-6 lg:h-20 lg:w-20">
                  <Settings className="h-7 w-7 text-green-500 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
                </div>
                <CardTitle className={adminCardTitleClassName}>Formulários</CardTitle>
              </CardHeader>
              <CardContent className={adminCardContentClassName}>
                <p className={adminCardBodyClassName}>
                  Configure e personalize seus formulários com campos fixos obrigatórios.
                </p>
                <Button className={adminCardButtonClassName}>
                  Acessar Formulários
                </Button>
              </CardContent>
            </Card>

            <Card className={`${adminCardClassName} hover:border-purple-500/30`} style={{ ['--card-glow' as string]: 'rgba(168,85,247,0.30)' }} onClick={() => setCurrentView('leads')}>
              <CardHeader className={adminCardHeaderClassName}>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/30 sm:h-16 sm:w-16 lg:mb-6 lg:h-20 lg:w-20">
                  <Users className="h-7 w-7 text-purple-500 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
                </div>
                <CardTitle className={adminCardTitleClassName}>Gerenciar Leads</CardTitle>
              </CardHeader>
              <CardContent className={adminCardContentClassName}>
                <p className={adminCardBodyClassName}>
                  Visualize e gerencie todos os leads coletados pelos seus formulários.
                </p>
                <Button className={adminCardButtonClassName}>
                  Ver Leads
                </Button>
              </CardContent>
            </Card>

            <Card className={`${adminCardClassName} hover:border-white/20`} style={{ ['--card-glow' as string]: 'rgba(255,255,255,0.18)' }} onClick={() => setCurrentView('management')}>
              <CardHeader className={adminCardHeaderClassName}>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1f1f1f] sm:h-16 sm:w-16 lg:mb-6 lg:h-20 lg:w-20">
                  <BarChart className="h-7 w-7 text-white sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
                </div>
                <CardTitle className={adminCardTitleClassName}>Gestão</CardTitle>
              </CardHeader>
              <CardContent className={adminCardContentClassName}>
                <p className={adminCardBodyClassName}>
                  Dashboard com gráficos e estatísticas dos planos assinados pelos leads.
                </p>
                <Button className={adminCardButtonClassName}>
                  Ver Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card className={`${adminCardClassName} hover:border-cyan-500/30`} style={{ ['--card-glow' as string]: 'rgba(34,211,238,0.30)' }} onClick={() => setCurrentView('achievements-config')}>
              <CardHeader className={adminCardHeaderClassName}>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/30 sm:h-16 sm:w-16 lg:mb-6 lg:h-20 lg:w-20">
                  <Trophy className="h-7 w-7 text-cyan-400 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
                </div>
                <CardTitle className={adminCardTitleClassName}>Config. de Conquistas</CardTitle>
              </CardHeader>
              <CardContent className={adminCardContentClassName}>
                <p className={adminCardBodyClassName}>
                  Cadastre em massa as insígnias, imagens, subtítulos e a cor de categoria usada na tela do cliente.
                </p>
                <Button className={adminCardButtonClassName}>
                  Configurar Conquistas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'ai-config':
        return <AIConfigPage onBack={() => setCurrentView('home')} />;

      case 'management':
        return renderAdminShell(<ManagementDashboard />, { maxWidthClassName: 'max-w-6xl', backTarget: 'home' });

      case 'achievements-config':
        return renderAdminShell(<AchievementsConfigPage />, { maxWidthClassName: 'max-w-6xl', backTarget: 'home' });

      case 'forms-list':
        return renderAdminShell(
          <FormsList
            forms={forms}
            onSelectForm={handleSelectForm}
            onDeleteForm={deleteForm}
            onCreateNew={handleCreateForm}
          />,
          { maxWidthClassName: 'max-w-4xl', backTarget: 'home' }
        );

      case 'leads':
        return renderAdminShell(<LeadsManager />, { maxWidthClassName: 'max-w-6xl', backTarget: 'home' });

      case 'edit-form':
        if (!currentForm) {
          return renderAdminShell(
            <div className="client-surface-panel rounded-3xl p-8 text-white">Formulário não encontrado</div>,
            { maxWidthClassName: 'max-w-4xl', backTarget: 'forms-list' }
          );
        }

        return renderAdminShell(
          <AdminDashboard
            formConfig={currentForm}
            onFormConfigChange={handleFormConfigChange}
            onPreview={() => {}}
            onBack={() => setCurrentView('forms-list')}
          />,
          { maxWidthClassName: 'max-w-4xl', backTarget: 'forms-list' }
        );

      default:
        return renderHome();
    }
  };

  return renderContent();
};

export default Index;
