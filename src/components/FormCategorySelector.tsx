
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, MessageSquare, Edit3, Dumbbell, Pill } from 'lucide-react';

interface FormCategorySelectorProps {
  onSelect: (category: 'anamnese-dieta' | 'feedback' | 'livre' | 'anamnese-treino' | 'anamnese-suplementacao') => void;
  onCancel: () => void;
}

export const FormCategorySelector: React.FC<FormCategorySelectorProps> = ({
  onSelect,
  onCancel,
}) => {
  const categories = [
    {
      id: 'anamnese-dieta' as const,
      title: 'Anamnese Dieta',
      description: 'Formulário de avaliação nutricional do paciente',
      icon: FileText,
      color: 'blue',
    },
    {
      id: 'anamnese-treino' as const,
      title: 'Anamnese Treino',
      description: 'Formulário de avaliação física e treino do paciente',
      icon: Dumbbell,
      color: 'orange',
    },
    {
      id: 'anamnese-suplementacao' as const,
      title: 'Anamnese Suplementação',
      description: 'Formulário de avaliação de suplementação do paciente',
      icon: Pill,
      color: 'purple',
    },
    {
      id: 'feedback' as const,
      title: 'Feedback',
      description: 'Formulário de avaliação e comentários',
      icon: MessageSquare,
      color: 'red',
    },
    {
      id: 'livre' as const,
      title: 'Formulário Livre',
      description: 'Formulário personalizado sem categoria específica',
      icon: Edit3,
      color: 'green',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-6">Escolha o tipo de formulário</h3>
        
        <div className="grid gap-4 mb-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card
                key={category.id}
                className="bg-gray-800 border-gray-600 hover:border-gray-500 cursor-pointer transition-all duration-200 hover:bg-gray-750"
                onClick={() => onSelect(category.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${category.color}-500/20`}>
                      <IconComponent className={`w-6 h-6 text-${category.color}-500`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{category.title}</h4>
                      <p className="text-gray-400 text-sm">{category.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};
