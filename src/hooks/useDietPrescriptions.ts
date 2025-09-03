
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DietPrescription {
  id: string;
  user_id: string;
  form_response_id?: string;
  file_path: string;
  file_name: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived';
}

export const useDietPrescriptions = (userId?: string) => {
  return useQuery({
    queryKey: ['diet-prescriptions', userId],
    queryFn: async () => {
      console.log('🔍 [DIET PRESCRIPTIONS] Buscando prescrições de dieta para usuário:', userId);
      
      if (!userId) {
        console.log('⚠️ [DIET PRESCRIPTIONS] Nenhum userId fornecido');
        return [];
      }

      const { data, error } = await supabase
        .from('diet_prescriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [DIET PRESCRIPTIONS] Erro ao buscar prescrições:', error);
        throw error;
      }

      console.log('✅ [DIET PRESCRIPTIONS] Prescrições encontradas:', data?.length || 0);
      return data as DietPrescription[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 15, // 15 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false, // Não refaz a query quando volta o foco
    refetchOnMount: false, // Não refaz a query ao montar se já tem dados
    retry: 3,
    retryDelay: 1000,
  });
};

export const useUploadDietPdf = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      file, 
      userId, 
      formResponseId 
    }: { 
      file: File; 
      userId: string; 
      formResponseId?: string;
    }) => {
      console.log('📤 [UPLOAD PDF] Iniciando upload para usuário:', userId);

      // Create file path: user_id/timestamp_filename para organizar por usuário
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${userId}/${fileName}`;

      console.log('📁 [UPLOAD PDF] Organizando arquivo no bucket por usuário:', filePath);

      // Upload file to storage with proper user organization
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diet-pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [UPLOAD PDF] Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ [UPLOAD PDF] Arquivo enviado com sucesso no bucket:', uploadData.path);

      // Save prescription record in database with correlation to bucket path
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('diet_prescriptions')
        .insert({
          user_id: userId,
          form_response_id: formResponseId,
          file_path: uploadData.path,
          file_name: file.name,
          status: 'active'
        })
        .select()
        .single();

      if (prescriptionError) {
        console.error('❌ [UPLOAD PDF] Erro ao salvar prescrição na tabela:', prescriptionError);
        // Try to cleanup uploaded file from bucket if database save fails
        await supabase.storage.from('diet-pdfs').remove([filePath]);
        throw prescriptionError;
      }

      console.log('✅ [UPLOAD PDF] Prescrição salva:', prescriptionData);
      return prescriptionData;
    },
    onSuccess: (data) => {
      console.log('🎉 [UPLOAD PDF] Upload concluído:', {
        user_id: data.user_id,
        file_path: data.file_path
      });
      
      toast({
        title: "PDF Enviado",
        description: "A prescrição de dieta foi enviada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['diet-prescriptions'] });
    },
    onError: (error) => {
      console.error('💥 [UPLOAD PDF] Erro na mutação:', error);
      toast({
        title: "Erro no Upload",
        description: "Não foi possível enviar o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  });
};
