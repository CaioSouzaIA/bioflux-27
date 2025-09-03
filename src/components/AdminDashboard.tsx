
import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Save, ArrowLeft } from 'lucide-react';
import { FormField, FormConfig } from '@/types/form';
import { useToast } from '@/hooks/use-toast';
import { DraggableFieldEditor } from './DraggableFieldEditor';

interface AdminDashboardProps {
  formConfig: FormConfig;
  onFormConfigChange: (config: FormConfig) => void;
  onPreview: () => void;
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  formConfig,
  onFormConfigChange,
  onPreview,
  onBack
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [localFormConfig, setLocalFormConfig] = useState(formConfig);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateFormTitle = (title: string) => {
    console.log('✏️ Atualizando título do formulário:', title);
    const updatedConfig = { ...localFormConfig, title };
    setLocalFormConfig(updatedConfig);
  };

  const updateFormDescription = (description: string) => {
    console.log('✏️ Atualizando descrição do formulário:', description);
    const updatedConfig = { ...localFormConfig, description };
    setLocalFormConfig(updatedConfig);
  };

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'Nova Pergunta',
      required: false,
      order: localFormConfig.fields.length
    };
    
    console.log('➕ Adicionando novo campo:', newField);
    
    const updatedConfig = {
      ...localFormConfig,
      fields: [...localFormConfig.fields, newField]
    };
    
    console.log('📋 Formulário atualizado após adição:', updatedConfig);
    setLocalFormConfig(updatedConfig);
  };

  const updateField = (index: number, field: FormField) => {
    console.log('✏️ Atualizando campo no índice:', index, 'Campo:', field);
    
    // Não permitir edição dos campos fixos (Nome, WhatsApp, Email e Refeições por dia)
    const fixedFieldIds = ['nome', 'whatsapp', 'email', 'refeicoes_por_dia'];
    if (fixedFieldIds.includes(field.id)) {
      toast({
        title: "Campo Obrigatório",
        description: "Os campos Nome, WhatsApp, Email e Refeições por dia são obrigatórios e não podem ser alterados.",
        variant: "destructive",
      });
      return;
    }

    const newFields = [...localFormConfig.fields];
    newFields[index] = field;
    
    const updatedConfig = { 
      ...localFormConfig, 
      fields: newFields
    };
    console.log('📋 Formulário atualizado após edição do campo:', updatedConfig);
    setLocalFormConfig(updatedConfig);
  };

  const removeField = (index: number) => {
    const field = localFormConfig.fields[index];
    console.log('🗑️ Removendo campo no índice:', index, 'Campo:', field);
    
    const fixedFieldIds = ['nome', 'whatsapp', 'email', 'refeicoes_por_dia'];
    
    if (fixedFieldIds.includes(field.id)) {
      toast({
        title: "Campo Obrigatório",
        description: "Os campos Nome, WhatsApp, Email e Refeições por dia são obrigatórios e não podem ser removidos.",
        variant: "destructive",
      });
      return;
    }

    const newFields = localFormConfig.fields.filter((_, i) => i !== index);
    const reorderedFields = newFields.map((field, i) => ({ ...field, order: i }));
    
    const updatedConfig = { 
      ...localFormConfig, 
      fields: reorderedFields
    };
    console.log('📋 Formulário atualizado após remoção do campo:', updatedConfig);
    setLocalFormConfig(updatedConfig);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      console.log('🔄 Reordenando campos - De:', active.id, 'Para:', over.id);
      
      const oldIndex = localFormConfig.fields.findIndex(field => field.id === active.id);
      const newIndex = localFormConfig.fields.findIndex(field => field.id === over.id);
      
      const reorderedFields = arrayMove(localFormConfig.fields, oldIndex, newIndex);
      // Atualizar a ordem de cada campo
      const updatedFields = reorderedFields.map((field, index) => ({
        ...field,
        order: index
      }));
      
      const updatedConfig = { 
        ...localFormConfig, 
        fields: updatedFields
      };
      console.log('📋 Formulário atualizado após reordenação:', updatedConfig);
      setLocalFormConfig(updatedConfig);
    }
  };

  const saveForm = async () => {
    console.log('💾 Salvando formulário manualmente:', localFormConfig);
    setIsSaving(true);
    
    try {
      // Salvar com timestamp atualizado
      const formToSave = {
        ...localFormConfig,
        updatedAt: new Date().toISOString()
      };
      
      onFormConfigChange(formToSave);
      
      toast({
        title: "Formulário Salvo",
        description: "Configurações do formulário foram salvas com sucesso!",
      });
    } catch (error) {
      console.error('❌ Erro ao salvar formulário:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Ocorreu um erro ao salvar o formulário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="outline" onClick={onBack} className="border-border text-foreground hover:bg-accent">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar à Lista
        </Button>
        <img 
          src="/lovable-uploads/e99759f8-0f30-4356-96b6-5d8b2ef20802.png" 
          alt="BIOFLUX.AI" 
          className="h-12 mx-auto sm:mx-0"
        />
        <div className="flex justify-end w-full sm:w-auto">
          <Button 
            onClick={saveForm} 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Configurações do Formulário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="form-title" className="text-foreground">Título do Formulário</Label>
            <Input
              id="form-title"
              value={localFormConfig.title}
              onChange={(e) => updateFormTitle(e.target.value)}
              placeholder="Digite o título do formulário"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground mt-2"
            />
          </div>
          <div>
            <Label htmlFor="form-description" className="text-foreground">Descrição</Label>
            <Textarea
              id="form-description"
              value={localFormConfig.description}
              onChange={(e) => updateFormDescription(e.target.value)}
              placeholder="Digite a descrição do formulário"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground mt-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground">
            Campos do Formulário
            <Button onClick={addField} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Campo
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {localFormConfig.fields.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Nenhum campo adicionado. Clique em "Adicionar Campo" para começar.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={localFormConfig.fields} strategy={verticalListSortingStrategy}>
                  {localFormConfig.fields.map((field, index) => (
                    <DraggableFieldEditor
                      key={field.id}
                      field={field}
                      onUpdate={(updatedField) => updateField(index, updatedField)}
                      onRemove={() => removeField(index)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
