import React from 'react';
import { ArrowLeft, Utensils } from 'lucide-react';

import { BackgroundAnimation } from '@/components/BackgroundAnimation';
import { Button } from '@/components/ui/button';
import { DietPlanContent } from '@/components/diet/DietPlanContent';
import type { DietPrescription } from '@/hooks/useDietPrescriptions';

interface DietViewProps {
  respondentName: string;
  prescription: DietPrescription;
  onBack: () => void;
}

export const DietView: React.FC<DietViewProps> = ({
  respondentName,
  prescription,
  onBack,
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
              <Utensils className="h-8 w-8 text-emerald-400" />
              {prescription.plan_name}
            </h1>
            <p className="text-sm text-white/60">
              Visualização estruturada do plano alimentar de {respondentName}
            </p>
          </div>

          <DietPlanContent prescription={prescription} />
        </div>
      </div>
    </div>
  );
};
