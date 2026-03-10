import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, Dumbbell } from 'lucide-react';
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

  const handleViewPdf = (prescription: TrainingPrescription) => {
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


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="client-surface-panel rounded-3xl animate-pulse">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <Card className="client-surface-panel rounded-3xl">
        <CardContent className="text-center py-12">
          <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhuma prescrição de treino encontrada
          </h3>
          <p className="text-gray-400">
            Suas prescrições de treino em PDF aparecerão aqui quando estiverem prontas.
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
          <Card key={prescription.id} className="client-surface-panel rounded-3xl transition-all hover:border-white/15">
            <CardHeader>
              <div className="flex items-center justify-between">
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
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Criado em: {formatDate(prescription.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-end">
                <Button 
                  variant="outline"
                  className="client-back-button"
                  onClick={() => handleViewPdf(prescription)}
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