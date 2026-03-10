import React, { useState } from 'react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { FormsList } from '@/components/FormsList';
import { LeadsManager } from '@/components/LeadsManager';
import { AIConfigPage } from '@/components/AIConfigPage';
import { ManagementDashboard } from '@/components/ManagementDashboard';
import { FormConfig } from '@/types/form';
import { useFormManager } from '@/hooks/useFormManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, Bot, BarChart, ArrowLeft } from 'lucide-react';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import ProfileDropdown from '@/components/ProfileDropdown';

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'forms-list' | 'edit-form' | 'leads' | 'ai-config' | 'management'>('home');
  const { forms, setCurrentFormId, createForm, updateForm, deleteForm, getCurrentForm } = useFormManager();

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

          <div className="grid grid-cols-1 gap-4 px-2 mb-12 mx-auto max-w-6xl md:gap-8 lg:grid-cols-2 xl:grid-cols-4">
            <Card className="client-glass-card flex h-full cursor-pointer flex-col transition-all duration-500 hover:scale-[1.02] hover:border-orange-500/30" style={{ ['--card-glow' as string]: 'rgba(249,115,22,0.30)' }} onClick={() => setCurrentView('ai-config')}>
              <CardHeader className="p-3 pb-4 text-center md:p-6 md:pb-6">
                <div className="flex items-center justify-center mx-auto mb-3 rounded-2xl w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/30 md:w-20 md:h-20 md:mb-6">
                  <Bot className="w-6 h-6 text-orange-500 md:w-10 md:h-10" />
                </div>
                <CardTitle className="mb-2 text-lg text-white md:text-2xl md:mb-4">Configurações da IA</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between p-3 pt-0 text-center md:p-6">
                <p className="mb-4 text-sm leading-relaxed text-gray-300 md:text-lg md:mb-8">
                  Configure o bot de IA para prescrições personalizadas de dietas.
                </p>
                <Button className="w-full rounded-xl client-action-button text-sm md:text-lg py-3 md:py-6 transition-all duration-300">
                  Configurar IA
                </Button>
              </CardContent>
            </Card>

            <Card className="client-glass-card flex h-full cursor-pointer flex-col transition-all duration-500 hover:scale-[1.02] hover:border-green-500/30" style={{ ['--card-glow' as string]: 'rgba(34,197,94,0.30)' }} onClick={() => setCurrentView('forms-list')}>
              <CardHeader className="p-3 pb-4 text-center md:p-6 md:pb-6">
                <div className="flex items-center justify-center mx-auto mb-3 rounded-2xl w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/30 md:w-20 md:h-20 md:mb-6">
                  <Settings className="w-6 h-6 text-green-500 md:w-10 md:h-10" />
                </div>
                <CardTitle className="mb-2 text-lg text-white md:text-2xl md:mb-4">Formulários</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between p-3 pt-0 text-center md:p-6">
                <p className="mb-4 text-sm leading-relaxed text-gray-300 md:text-lg md:mb-8">
                  Configure e personalize seus formulários com campos fixos obrigatórios.
                </p>
                <Button className="w-full rounded-xl client-action-button text-sm md:text-lg py-3 md:py-6 transition-all duration-300">
                  Acessar Formulários
                </Button>
              </CardContent>
            </Card>

            <Card className="client-glass-card flex h-full cursor-pointer flex-col transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30" style={{ ['--card-glow' as string]: 'rgba(168,85,247,0.30)' }} onClick={() => setCurrentView('leads')}>
              <CardHeader className="p-3 pb-4 text-center md:p-6 md:pb-6">
                <div className="flex items-center justify-center mx-auto mb-3 rounded-2xl w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/30 md:w-20 md:h-20 md:mb-6">
                  <Users className="w-6 h-6 text-purple-500 md:w-10 md:h-10" />
                </div>
                <CardTitle className="mb-2 text-lg text-white md:text-2xl md:mb-4">Gerenciar Leads</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between p-3 pt-0 text-center md:p-6">
                <p className="mb-4 text-sm leading-relaxed text-gray-300 md:text-lg md:mb-8">
                  Visualize e gerencie todos os leads coletados pelos seus formulários.
                </p>
                <Button className="w-full rounded-xl client-action-button text-sm md:text-lg py-3 md:py-6 transition-all duration-300">
                  Ver Leads
                </Button>
              </CardContent>
            </Card>

            <Card className="client-glass-card flex h-full cursor-pointer flex-col transition-all duration-500 hover:scale-[1.02] hover:border-white/20" style={{ ['--card-glow' as string]: 'rgba(255,255,255,0.18)' }} onClick={() => setCurrentView('management')}>
              <CardHeader className="p-3 pb-4 text-center md:p-6 md:pb-6">
                <div className="flex items-center justify-center mx-auto mb-3 rounded-2xl w-12 h-12 bg-[#1f1f1f] md:w-20 md:h-20 md:mb-6">
                  <BarChart className="w-6 h-6 text-white md:w-10 md:h-10" />
                </div>
                <CardTitle className="mb-2 text-lg text-white md:text-2xl md:mb-4">Gestão</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between p-3 pt-0 text-center md:p-6">
                <p className="mb-4 text-sm leading-relaxed text-gray-300 md:text-lg md:mb-8">
                  Dashboard com gráficos e estatísticas dos planos assinados pelos leads.
                </p>
                <Button className="w-full rounded-xl client-action-button text-sm md:text-lg py-3 md:py-6 transition-all duration-300">
                  Ver Dashboard
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
