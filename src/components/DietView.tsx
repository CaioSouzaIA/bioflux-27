
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Utensils } from 'lucide-react';
import { FormResponse } from '@/types/form';

interface DietViewProps {
  response: FormResponse;
  respondentName: string;
  dietPlan: string | null;
  onBack: () => void;
}

export const DietView: React.FC<DietViewProps> = ({ 
  response, 
  respondentName, 
  dietPlan, 
  onBack 
}) => {
  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return 'Data não disponível';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="border-gray-700 text-black bg-white hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <img 
              src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
              alt="BIOFLUX.AI" 
              className="h-12"
            />
            <div className="w-[100px]"></div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Utensils className="w-8 h-8 text-green-500" />
              Plano Alimentar - {respondentName}
            </h1>
            <p className="text-gray-400">
              Gerado em: {formatDate(response.submittedAt)}
            </p>
          </div>

          <Card className="bg-[#161616] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-500" />
                Dieta Personalizada
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dietPlan ? (
                <div className="text-white whitespace-pre-wrap leading-relaxed">
                  {dietPlan}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Utensils className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">
                    Plano alimentar ainda não gerado
                  </p>
                  <p className="text-gray-500 text-sm">
                    O plano alimentar será gerado automaticamente após o processamento das respostas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
