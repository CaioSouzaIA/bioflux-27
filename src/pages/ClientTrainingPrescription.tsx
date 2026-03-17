import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/card';
import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { Button } from '@/components/ui/button';
import { TrainingView } from '@/components/TrainingView';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTrainingPrescriptions } from '@/hooks/useTrainingPrescriptions';

const ClientTrainingPrescription: React.FC = () => {
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: trainingPrescriptions = [], isLoading } = useTrainingPrescriptions(user?.id);

  const prescriptionIndex = trainingPrescriptions.findIndex(
    (item) => item.id === prescriptionId,
  );
  const prescription = prescriptionIndex >= 0 ? trainingPrescriptions[prescriptionIndex] : null;
  const newerPrescription = prescriptionIndex > 0 ? trainingPrescriptions[prescriptionIndex - 1] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen overflow-hidden bg-black">
        <BackgroundAnimation />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <Card className="client-surface-panel w-full max-w-lg rounded-3xl">
            <CardContent className="p-8 text-center text-white">
              Carregando treino...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen overflow-hidden bg-black">
        <BackgroundAnimation />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <Card className="client-surface-panel w-full max-w-lg rounded-3xl">
            <CardContent className="space-y-4 p-8 text-center text-white">
              <p className="text-lg font-semibold">Treino não encontrado</p>
              <p className="text-sm text-white/60">
                Esse plano pode ter sido removido ou não pertence mais à sua lista atual.
              </p>
              <Button
                type="button"
                className="client-action-button"
                onClick={() => navigate('/client/prescriptions?tab=treino', { replace: true })}
              >
                Voltar para prescrições
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <TrainingView
      respondentName={prescription.structured_plan?.header.user_name || 'você'}
      prescription={prescription}
      onBack={() => navigate('/client/prescriptions?tab=treino', { replace: true })}
      enableCheckins
      checkinStartDate={prescription.created_at}
      checkinEndDateExclusive={newerPrescription?.created_at ?? null}
    />
  );
};

export default ClientTrainingPrescription;
