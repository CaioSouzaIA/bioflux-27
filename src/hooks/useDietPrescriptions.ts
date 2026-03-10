import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { StructuredDietPlan, DietGenerationStatus } from '@/types/diet';

export interface DietPrescription {
  id: string;
  user_id: string;
  form_response_id: string | null;
  file_path: string | null;
  file_name: string | null;
  plan_name: string;
  plan_sequence: number;
  generation_status: DietGenerationStatus;
  structured_plan: StructuredDietPlan | null;
  raw_plan_text: string | null;
  generation_payload: Record<string, unknown> | null;
  model_slug: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
  status: 'active' | 'archived' | null;
}

const buildLegacyPlanName = (fullName: string | null, sequence: number) => {
  const normalizedName = fullName?.trim() || 'Cliente';
  return `Plano alimentar ${sequence} - ${normalizedName}`;
};

export const useDietPrescriptions = (userId?: string) =>
  useQuery({
    queryKey: ['diet-prescriptions', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('diet_prescriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as DietPrescription[];
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const items = query.state.data as DietPrescription[] | undefined;
      return items?.some((item) => item.generation_status === 'pending' || item.generation_status === 'processing')
        ? 5000
        : false;
    },
  });

export const useUploadDietPdf = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      file,
      userId,
      formResponseId,
    }: {
      file: File;
      userId: string;
      formResponseId?: string;
    }) => {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${userId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diet-pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const [{ count }, { data: profile }] = await Promise.all([
        supabase
          .from('diet_prescriptions')
          .select('*', { head: true, count: 'exact' })
          .eq('user_id', userId),
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userId)
          .maybeSingle(),
      ]);

      const planSequence = (count ?? 0) + 1;
      const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() || null;

      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('diet_prescriptions')
        .insert({
          user_id: userId,
          form_response_id: formResponseId ?? null,
          file_path: uploadData.path,
          file_name: file.name,
          plan_name: buildLegacyPlanName(fullName, planSequence),
          plan_sequence: planSequence,
          generation_status: 'completed',
          completed_at: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (prescriptionError) {
        await supabase.storage.from('diet-pdfs').remove([filePath]);
        throw prescriptionError;
      }

      return prescriptionData as DietPrescription;
    },
    onSuccess: () => {
      toast({
        title: 'PDF Enviado',
        description: 'A prescrição de dieta foi enviada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['diet-prescriptions'] });
    },
    onError: () => {
      toast({
        title: 'Erro no Upload',
        description: 'Não foi possível enviar o PDF. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
};
