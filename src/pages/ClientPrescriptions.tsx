
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UtensilsCrossed, Dumbbell } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { useNavigate } from 'react-router-dom';
import { DietPdfViewer } from '@/components/DietPdfViewer';
import { TrainingPdfViewer } from '@/components/TrainingPdfViewer';
import { useDietPrescriptions } from '@/hooks/useDietPrescriptions';
import { useTrainingPrescriptions } from '@/hooks/useTrainingPrescriptions';
import { useQueryClient } from '@tanstack/react-query';

const ClientPrescriptions: React.FC = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Buscar prescrições de dieta e treino do usuário atual
  const { data: dietPrescriptions = [], isLoading: isDietLoading } = useDietPrescriptions(user?.id);
  const { data: trainingPrescriptions = [], isLoading: isTrainingLoading } = useTrainingPrescriptions(user?.id);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Invalidate queries when leaving prescriptions page to ensure fresh data on return
      console.log('🔄 [PRESCRIPTIONS] Cleaning up and invalidating queries on page exit');
      queryClient.invalidateQueries({ queryKey: ['diet-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['training-prescriptions'] });
    };
  }, [queryClient]);

  const handleLogout = async () => {
    await signOut();
    navigate('/client');
  };

  const handleBackToClient = () => {
    console.log('🔙 [PRESCRIPTIONS] Navigating back to client dashboard');
    
    // Clear any potential stale data before navigating
    queryClient.invalidateQueries({ queryKey: ['diet-prescriptions'] });
    queryClient.invalidateQueries({ queryKey: ['training-prescriptions'] });
    
    // Navigate with replace to avoid back button issues
    navigate('/client', { replace: true });
  };

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <BackgroundAnimation />
      
      <div className="relative z-10 min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pt-8">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleBackToClient}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-600 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <img 
                src="/lovable-uploads/47b13cc6-5100-44ec-a86b-17a57bac71c6.png" 
                alt="BIOFLUX.AI" 
                className="h-10"
              />
            </div>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Suas Prescrições</h1>
            <p className="text-gray-300">
              Visualize e baixe suas prescrições personalizadas em PDF
            </p>
          </div>

          {/* Tabs para Dieta e Treino */}
          <Tabs defaultValue="dieta" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
              <TabsTrigger 
                value="dieta" 
                className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300"
              >
                <UtensilsCrossed className="w-4 h-4" />
                Dieta ({dietPrescriptions.length})
              </TabsTrigger>
              <TabsTrigger 
                value="treino" 
                className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white text-gray-300"
              >
                <Dumbbell className="w-4 h-4" />
                Treino ({trainingPrescriptions.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dieta" className="mt-6">
              <DietPdfViewer 
                prescriptions={dietPrescriptions} 
                isLoading={isDietLoading}
              />
            </TabsContent>
            
            <TabsContent value="treino" className="mt-6">
              <TrainingPdfViewer 
                prescriptions={trainingPrescriptions} 
                isLoading={isTrainingLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ClientPrescriptions;
