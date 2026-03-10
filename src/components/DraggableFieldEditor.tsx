
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { FormField } from '@/types/form';

interface DraggableFieldEditorProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onRemove: () => void;
}

export const DraggableFieldEditor: React.FC<DraggableFieldEditorProps> = ({
  field,
  onUpdate,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const updateField = (updates: Partial<FormField>) => {
    onUpdate({ ...field, ...updates });
  };

  const addOption = () => {
    const options = field.options || [];
    updateField({ options: [...options, ''] });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(field.options || [])];
    options[index] = value;
    updateField({ options });
  };

  const removeOption = (index: number) => {
    const options = field.options?.filter((_, i) => i !== index) || [];
    updateField({ options });
  };

  return (
    <Card ref={setNodeRef} style={style} className="client-surface-panel rounded-3xl">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-cyan-400"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-cyan-400 flex-1">Campo {field.order + 1}</h3>
          <Button
            variant="destructive"
            size="sm"
            onClick={onRemove}
            className="border-red-500/20 bg-red-500/80 hover:bg-red-500 text-white"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Tipo do Campo</Label>
            <Select value={field.type} onValueChange={(type) => updateField({ type: type as FormField['type'] })}>
              <SelectTrigger className="client-input-surface text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-white">
                <SelectItem value="text" className="text-white hover:bg-green-600 focus:bg-green-600 hover:text-white focus:text-white">Texto</SelectItem>
                <SelectItem value="textarea" className="text-white hover:bg-green-600 focus:bg-green-600 hover:text-white focus:text-white">Texto Longo</SelectItem>
                <SelectItem value="number" className="text-white hover:bg-green-600 focus:bg-green-600 hover:text-white focus:text-white">Número</SelectItem>
                <SelectItem value="email" className="text-white hover:bg-green-600 focus:bg-green-600 hover:text-white focus:text-white">E-mail</SelectItem>
                <SelectItem value="select" className="text-white hover:bg-green-600 focus:bg-green-600 hover:text-white focus:text-white">Lista Suspensa</SelectItem>
                <SelectItem value="radio" className="text-white hover:bg-green-600 focus:bg-green-600 hover:text-white focus:text-white">Múltipla Escolha</SelectItem>
                <SelectItem value="checkbox" className="text-white hover:bg-green-600 focus:bg-green-600 hover:text-white focus:text-white">Caixa de Seleção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-300">Rótulo do Campo</Label>
            <Input
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder="Digite o rótulo"
              className="client-input-surface"
            />
          </div>
          <div>
            <Label className="text-gray-300">Placeholder (opcional)</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => updateField({ placeholder: e.target.value })}
              placeholder="Texto de exemplo"
              className="client-input-surface"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={field.required}
              onCheckedChange={(required) => updateField({ required })}
              className="data-[state=checked]:bg-green-500"
            />
            <Label className="text-gray-300">Campo obrigatório</Label>
          </div>
        </div>

        {(field.type === 'select' || field.type === 'radio') && (
          <div className="mt-4">
            <Label className="text-gray-300">Opções</Label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                    className="client-input-surface"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/12 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addOption}
                className="client-action-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Opção
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
