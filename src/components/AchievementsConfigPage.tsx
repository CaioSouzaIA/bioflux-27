import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, Palette, Plus, Save, Trash2, Trophy, UploadCloud } from 'lucide-react';

interface BadgeDraft {
  id: string;
  title: string;
  subtitle: string;
  categoryColor: string;
  imageFile: File | null;
  previewUrl: string | null;
}

const DEFAULT_BADGE_COLOR = '#22D3EE';

const createDraft = (overrides?: Partial<BadgeDraft>): BadgeDraft => ({
  id: crypto.randomUUID(),
  title: '',
  subtitle: '',
  categoryColor: DEFAULT_BADGE_COLOR,
  imageFile: null,
  previewUrl: null,
  ...overrides,
});

const formatFileNameToTitle = (fileName: string) =>
  fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const safeHex = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized.padEnd(6, '0').slice(0, 6);

  const red = parseInt(safeHex.slice(0, 2), 16);
  const green = parseInt(safeHex.slice(2, 4), 16);
  const blue = parseInt(safeHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const AchievementsConfigPage: React.FC = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<BadgeDraft[]>([createDraft()]);
  const [existingBadgeColors, setExistingBadgeColors] = useState<Record<string, string>>({});

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filledDraftsCount = useMemo(
    () => drafts.filter((draft) => draft.title.trim() || draft.subtitle.trim() || draft.imageFile || draft.previewUrl).length,
    [drafts]
  );

  const updateDraft = (draftId: string, updates: Partial<BadgeDraft>) => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === draftId ? { ...draft, ...updates } : draft))
    );
  };

  const removeDraft = (draftId: string) => {
    setDrafts((current) => {
      if (current.length === 1) {
        return [createDraft()];
      }

      return current.filter((draft) => draft.id !== draftId);
    });
  };

  const handleSingleImageChange = (draftId: string, file: File | null) => {
    if (!file) return;

    updateDraft(draftId, {
      imageFile: file,
      previewUrl: URL.createObjectURL(file),
      title: formatFileNameToTitle(file.name),
    });
  };

  const saveBadgesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const draftsToSave = drafts.filter((draft) => draft.title.trim() || draft.subtitle.trim() || draft.imageFile);

      if (!draftsToSave.length) {
        throw new Error('Adicione pelo menos uma insígnia antes de salvar.');
      }

      for (const draft of draftsToSave) {
        if (!draft.title.trim() || !draft.subtitle.trim() || !draft.imageFile) {
          throw new Error('Todas as insígnias precisam ter imagem, título e subtítulo.');
        }
      }

      const payload = [];

      for (const draft of draftsToSave) {
        const fileExtension = draft.imageFile!.name.split('.').pop() || 'png';
        const filePath = `${user.id}/${Date.now()}-${slugify(draft.title)}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from('badges')
          .upload(filePath, draft.imageFile!, { upsert: false });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('badges').getPublicUrl(filePath);

        payload.push({
          name: draft.title.trim(),
          description: draft.subtitle.trim(),
          image_url: publicUrl,
          category_color: draft.categoryColor,
        });
      }

      const { error } = await supabase.from('badges').insert(payload);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      await queryClient.invalidateQueries({ queryKey: ['all-badges'] });

      setDrafts([createDraft()]);
      toast({
        title: 'Insígnias salvas',
        description: 'As novas insígnias foram cadastradas com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar insígnias:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível salvar as insígnias.',
        variant: 'destructive',
      });
    },
  });

  const updateExistingBadgeColorMutation = useMutation({
    mutationFn: async ({ badgeId, color }: { badgeId: string; color: string }) => {
      const { error } = await supabase
        .from('badges')
        .update({ category_color: color })
        .eq('id', badgeId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      await queryClient.invalidateQueries({ queryKey: ['all-badges'] });
      toast({
        title: 'Cor atualizada',
        description: 'A cor da categoria da insígnia foi atualizada.',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar cor da insígnia:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a cor da insígnia.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="space-y-8">
      <Card className="client-surface-panel rounded-3xl">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-cyan-400" />
              Configurações de Conquistas
            </CardTitle>
            <p className="mt-2 text-sm text-white/60">
              Cadastre várias insígnias no mesmo lote com imagem, título, subtítulo e cor da categoria.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => setDrafts((current) => [...current, createDraft()])}
              className="client-back-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova linha
            </Button>
            <Button
              type="button"
              onClick={() => saveBadgesMutation.mutate()}
              disabled={saveBadgesMutation.isPending}
              className="client-action-button"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveBadgesMutation.isPending ? 'Salvando...' : 'Salvar lote'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {drafts.map((draft, index) => (
              <Card key={draft.id} className="client-surface-subtle rounded-3xl border border-white/8">
                <CardContent className="space-y-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">Insígnia {index + 1}</p>
                      <p className="text-xs text-white/50">Descrição será usada como subtítulo na tela de conquistas.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeDraft(draft.id)}
                      className="client-back-button h-9 px-3"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex shrink-0 flex-col items-center gap-3">
                      <div
                        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2"
                        style={{ borderColor: hexToRgba(draft.categoryColor, 0.9), background: hexToRgba(draft.categoryColor, 0.12) }}
                      >
                        {draft.previewUrl ? (
                          <img src={draft.previewUrl} alt={draft.title || 'Preview da insígnia'} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <ImagePlus className="h-8 w-8 text-white/40" />
                        )}
                      </div>

                      <Label
                        htmlFor={`badge-upload-${draft.id}`}
                        className="inline-flex cursor-pointer items-center rounded-xl border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] px-3 py-2 text-sm font-medium text-white shadow-lg shadow-black/30 transition-all hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)]"
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Imagem
                      </Label>
                      <input
                        id={`badge-upload-${draft.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleSingleImageChange(draft.id, event.target.files?.[0] || null)}
                      />
                    </div>

                    <div className="grid flex-1 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Título</Label>
                        <Input
                          value={draft.title}
                          onChange={(event) => updateDraft(draft.id, { title: event.target.value })}
                          placeholder="Ex: Mestre do Ferro VI"
                          className="client-input-surface !text-white placeholder:text-white/35"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Subtítulo</Label>
                        <Input
                          value={draft.subtitle}
                          onChange={(event) => updateDraft(draft.id, { subtitle: event.target.value })}
                          placeholder="Ex: Complete 35 dias de treino em um mês"
                          className="client-input-surface !text-white placeholder:text-white/35"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-white">
                          <Palette className="h-4 w-4 text-cyan-400" />
                          Cor da categoria
                        </Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={draft.categoryColor}
                            onChange={(event) => updateDraft(draft.id, { categoryColor: event.target.value })}
                            className="h-11 w-14 cursor-pointer rounded-xl border border-white/10 bg-black/70 p-1"
                          />
                          <Input
                            value={draft.categoryColor}
                            onChange={(event) => updateDraft(draft.id, { categoryColor: event.target.value })}
                            className="client-input-surface !text-white uppercase placeholder:text-white/35"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/50 px-4 py-3 text-sm text-white/65">
            <span>{filledDraftsCount} insígnia(s) preparada(s) para salvar</span>
            <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              Lote
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="client-surface-panel rounded-3xl">
        <CardHeader>
          <CardTitle className="text-white">Insígnias cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="client-surface-subtle h-40 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : badges.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {badges.map((badge) => (
                <Card
                  key={badge.id}
                  className="client-surface-subtle rounded-3xl border"
                  style={{ borderColor: hexToRgba(badge.category_color || DEFAULT_BADGE_COLOR, 0.42) }}
                >
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-center gap-4">
                      <div
                        className="rounded-full border-2 p-1"
                        style={{
                          borderColor: hexToRgba(badge.category_color || DEFAULT_BADGE_COLOR, 0.9),
                          background: hexToRgba(badge.category_color || DEFAULT_BADGE_COLOR, 0.12),
                        }}
                      >
                        <img src={badge.image_url} alt={badge.name} className="h-16 w-16 rounded-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-white">{badge.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-white/60">{badge.description}</p>
                      </div>
                    </div>
                    <div className="mt-auto space-y-3">
                      <div className="space-y-2">
                        <Label className="text-white">Cor da categoria</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={existingBadgeColors[badge.id] ?? badge.category_color ?? DEFAULT_BADGE_COLOR}
                            onChange={(event) =>
                              setExistingBadgeColors((current) => ({
                                ...current,
                                [badge.id]: event.target.value,
                              }))
                            }
                            className="h-11 w-14 cursor-pointer rounded-xl border border-white/10 bg-black/70 p-1"
                          />
                          <Input
                            value={existingBadgeColors[badge.id] ?? badge.category_color ?? DEFAULT_BADGE_COLOR}
                            onChange={(event) =>
                              setExistingBadgeColors((current) => ({
                                ...current,
                                [badge.id]: event.target.value,
                              }))
                            }
                            className="client-input-surface !text-white uppercase placeholder:text-white/35"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() =>
                          updateExistingBadgeColorMutation.mutate({
                            badgeId: badge.id,
                            color: existingBadgeColors[badge.id] ?? badge.category_color ?? DEFAULT_BADGE_COLOR,
                          })
                        }
                        disabled={updateExistingBadgeColorMutation.isPending}
                        className="client-back-button w-full"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Salvar cor
                      </Button>

                      <Badge
                        variant="outline"
                        className="border-white/10 text-white"
                        style={{
                          borderColor: hexToRgba(badge.category_color || DEFAULT_BADGE_COLOR, 0.45),
                          color: badge.category_color || DEFAULT_BADGE_COLOR,
                        }}
                      >
                        {badge.category_color || DEFAULT_BADGE_COLOR}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="client-surface-subtle rounded-3xl p-10 text-center text-white/60">
              Nenhuma insígnia cadastrada ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
