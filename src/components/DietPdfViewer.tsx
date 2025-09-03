
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Calendar, UtensilsCrossed } from 'lucide-react';
import { DietPrescription } from '@/hooks/useDietPrescriptions';
import { useToast } from '@/hooks/use-toast';

interface DietPdfViewerProps {
  prescriptions: DietPrescription[];
  isLoading?: boolean;
}

export const DietPdfViewer: React.FC<DietPdfViewerProps> = ({ 
  prescriptions, 
  isLoading 
}) => {
  const { toast } = useToast();

  const handleViewPdf = (prescription: DietPrescription) => {
    try {
      console.log('👁️ [PDF VIEWER] Abrindo PDF:', {
        fileName: prescription.file_name,
        filePath: prescription.file_path,
        userId: prescription.user_id
      });
      
      // Open PDF in new tab with specific target name to avoid conflicts
      const newWindow = window.open(prescription.file_path, `diet_pdf_${prescription.id}`);
      
      // Focus on the new window if it was opened successfully
      if (newWindow) {
        newWindow.focus();
      } else {
        // Fallback if popup was blocked
        window.location.href = prescription.file_path;
      }
    } catch (error) {
      console.error('❌ [PDF VIEWER] Erro ao abrir PDF:', error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPdf = async (prescription: DietPrescription) => {
    try {
      const response = await fetch(prescription.file_path);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar o PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = prescription.file_name || 'arquivo.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ [PDF DOWNLOAD] Erro ao baixar PDF:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o PDF. Tente novamente.",
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
        {[1, 2].map((i) => (
          <Card key={i} className="bg-gray-900 border-gray-700">
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
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="text-center py-12">
          <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhuma prescrição disponível
          </h3>
          <p className="text-gray-400">
            Suas prescrições em PDF aparecerão aqui quando estiverem prontas.
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
          <Card key={prescription.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800/70 transition-all">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <UtensilsCrossed className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-white text-lg">
                        {prescription.file_name}
                      </CardTitle>
                      {isMostRecent && (
                        <Badge variant="outline" className="text-green-400 border-green-400 bg-green-400/10">
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
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="border-gray-600 bg-white text-gray-900 hover:bg-gray-100 hover:text-gray-800"
                    onClick={() => handleViewPdf(prescription)}
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleDownloadPdf(prescription)}
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
