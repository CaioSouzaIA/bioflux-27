
import React, { useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BucketUserCorrelationProps {
  onBucketUpdate?: (userId: string, filePath: string) => void;
}

export const BucketUserCorrelation: React.FC<BucketUserCorrelationProps> = ({ 
  onBucketUpdate 
}) => {
  const { user } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔗 [BUCKET CORRELATION] Iniciando monitoramento de correlação para usuário:', user.id);

    // Monitor changes in storage objects for the current user
    const channel = supabase
      .channel(`bucket-correlation-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'storage',
          table: 'objects',
          filter: `name=like.${user.id}/%`
        },
        (payload) => {
          console.log('➕ [BUCKET CORRELATION] Novo arquivo adicionado para usuário:', {
            userId: user.id,
            filePath: payload.new.name,
            bucketId: payload.new.bucket_id
          });

          // Correlacionar a criação do arquivo com a tabela diet_prescriptions
          if (payload.new.bucket_id === 'diet-pdfs') {
            onBucketUpdate?.(user.id, payload.new.name);
            
            toast({
              title: "Arquivo Adicionado",
              description: `Novo PDF correlacionado ao seu usuário: ${payload.new.name}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'storage',
          table: 'objects',
          filter: `name=like.${user.id}/%`
        },
        (payload) => {
          console.log('🔄 [BUCKET CORRELATION] Arquivo atualizado para usuário:', {
            userId: user.id,
            filePath: payload.new.name,
            bucketId: payload.new.bucket_id
          });

          // Correlacionar a atualização do arquivo
          if (payload.new.bucket_id === 'diet-pdfs') {
            onBucketUpdate?.(user.id, payload.new.name);
            
            toast({
              title: "Arquivo Atualizado",
              description: `PDF atualizado e correlacionado: ${payload.new.name}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 [BUCKET CORRELATION] Desconectando monitoramento para usuário:', user.id);
      supabase.removeChannel(channel);
    };
  }, [user?.id, onBucketUpdate, toast]);

  return null; // Este é um componente de monitoramento, não renderiza nada
};
