
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Dumbbell, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrainingPrescription } from '@/hooks/useTrainingPrescriptions';
import { useToast } from '@/hooks/use-toast';

interface TrainingPdfViewerProps {
  prescriptions: TrainingPrescription[];
  isLoading: boolean;
}

export const TrainingPdfViewer: React.FC<TrainingPdfViewerProps> = ({ 
  prescriptions, 
  isLoading 
}) => {
  const { toast } = useToast();

  const handleView = (prescription: TrainingPrescription) => {
    try {
      console.log('👁️ [TRAINING PDF VIEWER] Abrindo PDF:', {
        fileName: prescription.file_name,
        filePath: prescription.file_path,
        userId: prescription.user_id
      });
      
      // Open PDF in new tab with specific target name to avoid conflicts
      const newWindow = window.open(prescription.file_path, `training_pdf_${prescription.id}`);
      
      // Focus on the new window if it was opened successfully
      if (newWindow) {
        newWindow.focus();
      } else {
        // Fallback if popup was blocked
        window.location.href = prescription.file_path;
      }
    } catch (error) {
      console.error('❌ [TRAINING PDF VIEWER] Erro ao abrir PDF:', error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-[#161616] border-gray-700 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <Card className="bg-[#161616] border-gray-700 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhuma Prescrição de Treino Encontrada
          </h3>
          <p className="text-gray-400">
            Você ainda não possui prescrições de treino disponíveis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription, index) => {
        const isMostRecent = index === 0; // As prescrições vêm ordenadas por created_at desc
        
        return (
          <Card 
            key={prescription.id} 
            className="bg-[#161616] border-gray-700 backdrop-blur-sm hover:bg-[#1c1c1c] transition-all"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Dumbbell className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-white text-lg">
                        {prescription.file_name}
                      </CardTitle>
                      {isMostRecent && (
                        <Badge variant="outline" className="text-orange-400 border-orange-400 bg-orange-400/10">
                          Atual
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      Criado em: {format(new Date(prescription.created_at), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleView(prescription)}
                  className="border-gray-600 bg-white text-gray-900 hover:bg-gray-100 hover:text-gray-800"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
