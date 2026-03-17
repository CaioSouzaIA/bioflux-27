import React from 'react';
import { ArrowLeft, Dumbbell } from 'lucide-react';

import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { Button } from '@/components/ui/button';
import { TrainingPlanContent } from '@/components/training/TrainingPlanContent';
import type { TrainingPrescription } from '@/hooks/useTrainingPrescriptions';

interface TrainingViewProps {
  respondentName: string;
  prescription: TrainingPrescription;
  onBack: () => void;
  enableCheckins?: boolean;
  checkinStartDate?: string | null;
  checkinEndDateExclusive?: string | null;
}

export const TrainingView: React.FC<TrainingViewProps> = ({
  respondentName,
  prescription,
  onBack,
  enableCheckins = false,
  checkinStartDate = null,
  checkinEndDateExclusive = null,
}) => {
  return (
    <div className="min-h-screen overflow-hidden bg-black">
      <BackgroundAnimation />

      <div className="relative z-10 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              className="client-back-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <img
              src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png"
              alt="BIOFLUX.AI"
              className="h-12"
            />
            <div className="w-[100px]" />
          </div>

          <div className="mb-8">
            <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-white">
              <Dumbbell className="h-8 w-8 text-orange-400" />
              {prescription.plan_name}
            </h1>
            <p className="text-sm text-white/60">
              Visualização estruturada do plano de treino de {respondentName}
            </p>
          </div>

          <TrainingPlanContent
            prescription={prescription}
            enableCheckins={enableCheckins}
            checkinStartDate={checkinStartDate}
            checkinEndDateExclusive={checkinEndDateExclusive}
          />
        </div>
      </div>
    </div>
  );
};
