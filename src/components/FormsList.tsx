import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormConfig } from '@/types/form';
import { Edit, Trash2, Share, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { FormCategorySelector } from './FormCategorySelector';

interface FormsListProps {
  forms: FormConfig[];
  onSelectForm: (formId: string) => void;
  onDeleteForm: (formId: string) => void;
  onCreateNew: (category: 'anamnese-dieta' | 'feedback' | 'livre' | 'anamnese-treino' | 'anamnese-suplementacao') => void;
}

export const FormsList: React.FC<FormsListProps> = ({
  forms,
  onSelectForm,
  onDeleteForm,
  onCreateNew,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Buscar respostas por formulário do Supabase
  const { data: formResponses = {} } = useQuery({
    queryKey: ['form-responses', user?.id],
    queryFn: async () => {
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('form_responses')
        .select('form_id');
      
      if (error) {
        console.error('Erro ao buscar respostas:', error);
        return {};
      }
      
      // Contar respostas por form_id
      const responseCounts: Record<string, number> = {};
      data?.forEach((response) => {
        responseCounts[response.form_id] = (responseCounts[response.form_id] || 0) + 1;
      });
      
      return responseCounts;
    },
    enabled: !!user,
  });

  const handleShare = (form: FormConfig) => {
    const shareUrl = `${window.location.origin}/form/${form.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copiado!",
      description: "O link do formulário foi copiado para a área de transferência.",
    });
  };

  const handleViewResponses = (form: FormConfig) => {
    navigate(`/responses/${form.id}`);
  };

  const handlePreviewForm = (form: FormConfig) => {
    navigate(`/form/${form.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'anamnese-dieta':
        return 'bg-[#1f1f1f] text-white border-white/20';
      case 'anamnese-treino':
        return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 'anamnese-suplementacao':
        return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
      case 'feedback':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'livre':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'anamnese-dieta':
        return 'Anamnese Dieta';
      case 'anamnese-treino':
        return 'Anamnese Treino';
      case 'anamnese-suplementacao':
        return 'Anamnese Suplementação';
      case 'feedback':
        return 'Feedback';
      case 'livre':
        return 'Livre';
      default:
        return 'Indefinido';
    }
  };

  const getFormBorderClass = (category: string) => {
    switch (category) {
      case 'feedback':
        return 'border-red-500/50';
      case 'anamnese-dieta':
        return 'border-white/20';
      case 'anamnese-treino':
        return 'border-orange-500/50';
      case 'anamnese-suplementacao':
        return 'border-purple-500/50';
      case 'livre':
        return 'border-green-500/50';
      default:
        return 'border-gray-700';
    }
  };

  const handleCategorySelect = (category: 'anamnese-dieta' | 'feedback' | 'livre' | 'anamnese-treino' | 'anamnese-suplementacao') => {
    setShowCategorySelector(false);
    onCreateNew(category);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Meus Formulários</h2>
        <Button 
          onClick={() => setShowCategorySelector(true)} 
          className="client-action-button w-full sm:w-auto"
        >
          Novo Formulário
        </Button>
      </div>

      <div className="grid gap-6">
        {forms.length === 0 ? (
          <Card className="client-surface-panel rounded-3xl">
            <CardContent className="pt-8">
              <div className="text-center py-12">
                <p className="text-gray-300 mb-6">Nenhum formulário criado ainda.</p>
                <Button 
                  onClick={() => setShowCategorySelector(true)} 
                  className="client-action-button"
                >
                  Criar Primeiro Formulário
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          forms.map((form) => (
            <Card 
              key={form.id} 
              className={`client-surface-panel rounded-3xl transition-all duration-300 ${getFormBorderClass(form.category || 'livre')}`}
            >
              <CardHeader>
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-white text-lg break-words">{form.title}</CardTitle>
                    <p className="text-gray-300 text-sm mt-2 break-words">{form.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:ml-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewForm(form)}
                      className="border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors flex-1 sm:flex-none"
                      title="Visualizar formulário"
                    >
                      <Share className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResponses(form)}
                      className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-colors flex-1 sm:flex-none"
                      title="Ver respostas"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectForm(form.id)}
                      className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors flex-1 sm:flex-none"
                      title="Editar formulário"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteForm(form.id)}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex-1 sm:flex-none"
                      title="Excluir formulário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className={getCategoryBadgeColor(form.category || 'livre')}>
                      {getCategoryDisplayName(form.category || 'livre')}
                    </Badge>
                    <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-500 border-cyan-500/30">
                      {form.fields.length} campo(s)
                    </Badge>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                      Ativo
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                      {formResponses[form.id] || 0} resposta(s)
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-300">
                    Atualizado em {formatDate(form.updatedAt)}
                  </div>
                </div>
                <div className="mt-4 border-t border-white/8 pt-4">
                  <p className="text-xs text-gray-400 break-all">
                    Link de compartilhamento: <span className="text-cyan-500">{window.location.origin}/form/{form.id}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showCategorySelector && (
        <FormCategorySelector
          onSelect={handleCategorySelect}
          onCancel={() => setShowCategorySelector(false)}
        />
      )}
    </div>
  );
};
