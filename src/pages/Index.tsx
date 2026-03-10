
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
import { Settings, Users, Bot, BarChart } from 'lucide-react';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import AuthHeader from '@/components/AuthHeader';
import ProfileDropdown from '@/components/ProfileDropdown';

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'forms-list' | 'edit-form' | 'leads' | 'ai-config' | 'management'>('home');
  const {
    forms,
    currentFormId,
    setCurrentFormId,
    createForm,
    updateForm,
    deleteForm,
    getCurrentForm,
  } = useFormManager();

  const currentForm = getCurrentForm();

  const handleCreateForm = (category: 'anamnese-dieta' | 'feedback' | 'livre' | 'anamnese-treino' | 'anamnese-suplementacao' = 'livre') => {
    const newForm = createForm(category);
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

  const renderHome = () => (
    <div className="min-h-screen bg-black transition-colors duration-300 flex items-center justify-center p-4 md:p-8 relative">
      <BackgroundAnimation />
      
      <div className="max-w-6xl w-full relative z-10">
        <div className="text-center mb-6 md:mb-8">
          <div className="mb-2 md:mb-4">
            <img 
              src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
              alt="BIOFLUX.AI" 
              className="mx-auto h-64 w-64 md:h-52 md:w-auto object-contain"
            />
          </div>
          <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto leading-relaxed font-medium px-4">
            Sistema automatizado de prescrição de dietas com IA
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-8 mb-12 px-2 max-w-6xl mx-auto">
          <Card className="client-glass-card cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:border-orange-500/30" style={{ ['--card-glow' as string]: 'rgba(249,115,22,0.30)' }} onClick={() => setCurrentView('ai-config')}>
            <CardHeader className="text-center pb-4 md:pb-6 p-3 md:p-6">
              <div className="mx-auto w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl flex items-center justify-center mb-3 md:mb-6">
                <Bot className="w-6 h-6 md:w-10 md:h-10 text-orange-500" />
              </div>
              <CardTitle className="text-lg md:text-2xl text-white mb-2 md:mb-4">Configurações da IA</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-3 md:p-6 pt-0">
              <p className="text-gray-300 text-sm md:text-lg mb-4 md:mb-8 leading-relaxed">
                Configure o bot de IA para prescrições personalizadas de dietas.
              </p>
              <Button className="client-action-button w-full text-sm md:text-lg py-3 md:py-6 rounded-xl transition-all duration-300">
                Configurar IA
              </Button>
            </CardContent>
          </Card>

          <Card className="client-glass-card cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:border-green-500/30" style={{ ['--card-glow' as string]: 'rgba(34,197,94,0.30)' }} onClick={() => setCurrentView('forms-list')}>
            <CardHeader className="text-center pb-4 md:pb-6 p-3 md:p-6">
              <div className="mx-auto w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-2xl flex items-center justify-center mb-3 md:mb-6">
                <Settings className="w-6 h-6 md:w-10 md:h-10 text-green-500" />
              </div>
              <CardTitle className="text-lg md:text-2xl text-white mb-2 md:mb-4">Formulários</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-3 md:p-6 pt-0">
              <p className="text-gray-300 text-sm md:text-lg mb-4 md:mb-8 leading-relaxed">
                Configure e personalize seus formulários com campos fixos obrigatórios.
              </p>
              <Button className="client-action-button w-full text-sm md:text-lg py-3 md:py-6 rounded-xl transition-all duration-300">
                Acessar Formulários
              </Button>
            </CardContent>
          </Card>

          <Card className="client-glass-card cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30" style={{ ['--card-glow' as string]: 'rgba(168,85,247,0.30)' }} onClick={() => setCurrentView('leads')}>
            <CardHeader className="text-center pb-4 md:pb-6 p-3 md:p-6">
              <div className="mx-auto w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl flex items-center justify-center mb-3 md:mb-6">
                <Users className="w-6 h-6 md:w-10 md:h-10 text-purple-500" />
              </div>
              <CardTitle className="text-lg md:text-2xl text-white mb-2 md:mb-4">Gerenciar Leads</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-3 md:p-6 pt-0">
              <p className="text-gray-300 text-sm md:text-lg mb-4 md:mb-8 leading-relaxed">
                Visualize e gerencie todos os leads coletados pelos seus formulários.
              </p>
              <Button className="client-action-button w-full text-sm md:text-lg py-3 md:py-6 rounded-xl transition-all duration-300">
                Ver Leads
              </Button>
            </CardContent>
          </Card>

          <Card className="client-glass-card cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:border-white/20" style={{ ['--card-glow' as string]: 'rgba(255,255,255,0.18)' }} onClick={() => setCurrentView('management')}>
            <CardHeader className="text-center pb-4 md:pb-6 p-3 md:p-6">
              <div className="mx-auto w-12 h-12 md:w-20 md:h-20 bg-[#1f1f1f] rounded-2xl flex items-center justify-center mb-3 md:mb-6">
                <BarChart className="w-6 h-6 md:w-10 md:h-10 text-white" />
              </div>
              <CardTitle className="text-lg md:text-2xl text-white mb-2 md:mb-4">Gestão</CardTitle>
            </CardHeader>
            <CardContent className="text-center p-3 md:p-6 pt-0">
              <p className="text-gray-300 text-sm md:text-lg mb-4 md:mb-8 leading-relaxed">
                Dashboard com gráficos e estatísticas dos planos assinados pelos leads.
              </p>
              <Button className="client-action-button w-full text-sm md:text-lg py-3 md:py-6 rounded-xl transition-all duration-300">
                Ver Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed top-4 md:top-8 right-4 md:right-8 z-20">
        <ProfileDropdown />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'ai-config':
        return <AIConfigPage onBack={() => setCurrentView('home')} />;

      case 'management':
        return (
          <div className="min-h-screen relative overflow-hidden bg-black transition-colors duration-300">
            <BackgroundAnimation />
            <AuthHeader />
            <div className="relative z-10 p-6">
              <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentView('home')} className="client-back-button">
                    ← Voltar ao Início
                  </Button>
                  <img 
                    src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
                    alt="BIOFLUX.AI" 
                    className="h-12"
                  />
                  <div className="w-[100px]"></div>
                </div>
                <ManagementDashboard />
              </div>
            </div>
          </div>
        );

      case 'forms-list':
        return (
          <div className="min-h-screen relative overflow-hidden bg-black transition-colors duration-300">
            <BackgroundAnimation />
            <AuthHeader />
            <div className="relative z-10 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentView('home')} className="client-back-button">
                    ← Voltar ao Início
                  </Button>
                  <img 
                    src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
                    alt="BIOFLUX.AI" 
                    className="h-12"
                  />
                  <div className="w-[100px]"></div>
                </div>
                <FormsList
                  forms={forms}
                  onSelectForm={handleSelectForm}
                  onDeleteForm={deleteForm}
                  onCreateNew={handleCreateForm}
                />
              </div>
            </div>
          </div>
        );

      case 'leads':
        return (
          <div className="min-h-screen relative overflow-hidden bg-black transition-colors duration-300">
            <BackgroundAnimation />
            <AuthHeader />
            <div className="relative z-10 p-6">
              <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setCurrentView('home')} className="client-back-button">
                    ← Voltar ao Início
                  </Button>
                  <img 
                    src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
                    alt="BIOFLUX.AI" 
                    className="h-12"
                  />
                  <div className="w-[100px]"></div>
                </div>
                <LeadsManager />
              </div>
            </div>
          </div>
        );

      case 'edit-form':
        if (!currentForm) {
          return (
            <div className="min-h-screen relative overflow-hidden bg-black transition-colors duration-300 p-6 flex items-center justify-center">
            <BackgroundAnimation />
            <div className="relative z-10">
              <p className="text-white">Formulário não encontrado</p>
            </div>
            </div>
          );
        }
        return (
          <div className="min-h-screen relative overflow-hidden bg-black transition-colors duration-300">
            <BackgroundAnimation />
            <AuthHeader />
            <div className="relative z-10 p-6">
              <div className="max-w-4xl mx-auto">
                <AdminDashboard
                  formConfig={currentForm}
                  onFormConfigChange={handleFormConfigChange}
                  onPreview={() => {}}
                  onBack={() => setCurrentView('forms-list')}
                />
              </div>
            </div>
          </div>
        );

      default:
        return renderHome();
    }
  };

  return renderContent();
};

export default Index;
