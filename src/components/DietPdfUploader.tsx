
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText } from 'lucide-react';
import { useUploadDietPdf } from '@/hooks/useDietPrescriptions';
import { useToast } from '@/hooks/use-toast';

interface DietPdfUploaderProps {
  userId: string;
  formResponseId?: string;
  onUploadSuccess?: () => void;
}

export const DietPdfUploader: React.FC<DietPdfUploaderProps> = ({
  userId,
  formResponseId,
  onUploadSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { mutate: uploadPdf, isPending } = useUploadDietPdf();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Arquivo Inválido",
          description: "Por favor, selecione apenas arquivos PDF.",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Arquivo Muito Grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum Arquivo",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      });
      return;
    }

    uploadPdf(
      { 
        file: selectedFile, 
        userId, 
        formResponseId 
      },
      {
        onSuccess: () => {
          setSelectedFile(null);
          // Reset file input
          const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          onUploadSuccess?.();
        }
      }
    );
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-green-500" />
          Enviar Prescrição de Dieta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="pdf-upload" className="text-gray-300">
            Selecionar arquivo PDF
          </Label>
          <Input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="bg-gray-800 border-gray-600 text-white mt-2"
          />
          <p className="text-sm text-gray-400 mt-1">
            Máximo 10MB • Apenas arquivos PDF
          </p>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-3 bg-gray-800 rounded border border-gray-600">
            <FileText className="w-4 h-4 text-green-500" />
            <span className="text-white text-sm">{selectedFile.name}</span>
            <span className="text-gray-400 text-xs">
              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        )}

        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || isPending}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isPending ? (
            <>Enviando...</>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Enviar Prescrição
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
