import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ImagePlus,
  Palette,
  Plus,
  Save,
  Shapes,
  Trash2,
  Trophy,
  UploadCloud,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AchievementCategory {
  color: string;
  created_at: string;
  id: string;
  name: string;
}

interface BadgeWithCategory {
  achievement_title: string;
  category_color: string;
  category_id: string;
  created_at: string;
  description: string;
  id: string;
  image_url: string;
  metadata: unknown;
  name: string;
  achievement_categories: AchievementCategory | null;
}

interface BadgeDraft {
  achievementTitle: string;
  categoryId: string;
  id: string;
  imageFile: File | null;
  previewUrl: string | null;
  subtitle: string;
}

interface ExistingBadgeForm {
  achievementTitle: string;
  categoryId: string;
  description: string;
  id: string;
  imageFile: File | null;
  imageUrl: string;
  previewUrl: string | null;
}

const DEFAULT_BADGE_COLOR = '#22D3EE';
const PANEL_CARD_CLASS = 'achievements-config-panel rounded-3xl text-white';
const SUBTLE_CARD_CLASS = 'achievements-config-subtle rounded-3xl text-white';
const DARK_INPUT_CLASS = 'achievements-config-input';
type CategoryModalView = 'create' | 'edit';
type BadgeModalView = 'create' | 'edit';

const createDraft = (defaultCategoryId = '', overrides?: Partial<BadgeDraft>): BadgeDraft => ({
  achievementTitle: '',
  categoryId: defaultCategoryId,
  id: crypto.randomUUID(),
  imageFile: null,
  previewUrl: null,
  subtitle: '',
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
  const [categoryDraft, setCategoryDraft] = useState({ color: DEFAULT_BADGE_COLOR, name: '' });
  const [drafts, setDrafts] = useState<BadgeDraft[]>([createDraft()]);
  const [existingCategoryValues, setExistingCategoryValues] = useState<Record<string, { color: string; name: string }>>({});
  const [existingBadgeValues, setExistingBadgeValues] = useState<Record<string, ExistingBadgeForm>>({});
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [categoryModalView, setCategoryModalView] = useState<CategoryModalView>('create');
  const [badgeModalView, setBadgeModalView] = useState<BadgeModalView>('create');

  const { data: categories = [] } = useQuery({
    queryKey: ['achievement-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as AchievementCategory[];
    },
  });

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*, achievement_categories(id, name, color, created_at)')
        .order('achievement_title', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as BadgeWithCategory[];
    },
  });

  const filledDraftsCount = useMemo(
    () =>
      drafts.filter(
        (draft) =>
          draft.achievementTitle.trim() ||
          draft.subtitle.trim() ||
          draft.imageFile ||
          draft.previewUrl
      ).length,
    [drafts]
  );

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  useEffect(() => {
    if (!categories.length) return;

    setDrafts((current) =>
      current.map((draft) =>
        draft.categoryId
          ? draft
          : {
              ...draft,
              categoryId: categories[0].id,
            }
      )
    );
  }, [categories]);

  useEffect(() => {
    if (!badges.length) return;

    setExistingBadgeValues((current) => {
      const next = { ...current };

      for (const badge of badges) {
        if (!next[badge.id]) {
          next[badge.id] = {
            achievementTitle: badge.achievement_title,
            categoryId: badge.category_id,
            description: badge.description,
            id: badge.id,
            imageFile: null,
            imageUrl: badge.image_url,
            previewUrl: null,
          };
        }
      }

      return next;
    });
  }, [badges]);

  const ensureCategoryForNewDraft = (draft: BadgeDraft) => {
    if (draft.categoryId) return draft;
    return {
      ...draft,
      categoryId: categories[0]?.id || '',
    };
  };

  const updateDraft = (draftId: string, updates: Partial<BadgeDraft>) => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === draftId ? { ...draft, ...updates } : draft))
    );
  };

  const removeDraft = (draftId: string) => {
    setDrafts((current) => {
      if (current.length === 1) {
        return [createDraft(categories[0]?.id || '')];
      }

      return current.filter((draft) => draft.id !== draftId);
    });
  };

  const handleSingleImageChange = (draftId: string, file: File | null) => {
    if (!file) return;

    updateDraft(draftId, {
      achievementTitle: formatFileNameToTitle(file.name),
      imageFile: file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const updateExistingBadge = (badgeId: string, updates: Partial<ExistingBadgeForm>) => {
    setExistingBadgeValues((current) => ({
      ...current,
      [badgeId]: {
        ...current[badgeId],
        ...updates,
      },
    }));
  };

  const handleExistingBadgeImageChange = (badgeId: string, file: File | null) => {
    if (!file) return;

    updateExistingBadge(badgeId, {
      imageFile: file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = categoryDraft.name.trim();
      if (!trimmedName) {
        throw new Error('Informe o nome da categoria.');
      }

      const { error } = await supabase
        .from('achievement_categories')
        .insert({
          color: categoryDraft.color,
          name: trimmedName,
        });

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['achievement-categories'] });
      setCategoryDraft({ color: DEFAULT_BADGE_COLOR, name: '' });
      setCategoryModalView('edit');
      toast({
        title: 'Categoria criada',
        description: 'A categoria de conquista foi cadastrada com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível criar a categoria.',
        variant: 'destructive',
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, color, name }: { categoryId: string; color: string; name: string }) => {
      if (!name.trim()) {
        throw new Error('O nome da categoria é obrigatório.');
      }

      const { error } = await supabase
        .from('achievement_categories')
        .update({ color, name: name.trim() })
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['achievement-categories'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      await queryClient.invalidateQueries({ queryKey: ['all-badges'] });
      toast({
        title: 'Categoria atualizada',
        description: 'Nome e cor da categoria foram atualizados.',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar categoria:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar a categoria.',
        variant: 'destructive',
      });
    },
  });

  const saveBadgesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const draftsToSave = drafts.filter(
        (draft) => draft.achievementTitle.trim() || draft.subtitle.trim() || draft.imageFile
      );

      if (!draftsToSave.length) {
        throw new Error('Adicione pelo menos uma conquista antes de salvar.');
      }

      for (const draft of draftsToSave) {
        if (!draft.achievementTitle.trim() || !draft.subtitle.trim() || !draft.imageFile || !draft.categoryId) {
          throw new Error('Cada conquista precisa de categoria, imagem, nome e subtítulo.');
        }
      }

      const payload = [];

      for (const draft of draftsToSave) {
        const category = categoriesById.get(draft.categoryId);
        if (!category) {
          throw new Error('Selecione uma categoria válida para todas as conquistas.');
        }

        const fileExtension = draft.imageFile!.name.split('.').pop() || 'png';
        const filePath = `${user.id}/${Date.now()}-${slugify(draft.achievementTitle)}.${fileExtension}`;

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
          achievement_title: draft.achievementTitle.trim(),
          category_color: category.color,
          category_id: category.id,
          description: draft.subtitle.trim(),
          image_url: publicUrl,
          name: `${category.name} - ${draft.achievementTitle.trim()}`,
        });
      }

      const { error } = await supabase.from('badges').insert(payload);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      await queryClient.invalidateQueries({ queryKey: ['all-badges'] });
      setDrafts([createDraft(categories[0]?.id || '')]);
      setIsBadgeModalOpen(false);
      toast({
        title: 'Conquistas salvas',
        description: 'As novas conquistas foram cadastradas com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar conquistas:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível salvar as conquistas.',
        variant: 'destructive',
      });
    },
  });

  const updateBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const badgeState = existingBadgeValues[badgeId];
      if (!badgeState) {
        throw new Error('Conquista não encontrada para edição.');
      }

      if (!badgeState.achievementTitle.trim() || !badgeState.description.trim() || !badgeState.categoryId) {
        throw new Error('Título, subtítulo e categoria são obrigatórios.');
      }

      const category = categoriesById.get(badgeState.categoryId);
      if (!category) {
        throw new Error('Selecione uma categoria válida.');
      }

      let imageUrl = badgeState.imageUrl;

      if (badgeState.imageFile) {
        const fileExtension = badgeState.imageFile.name.split('.').pop() || 'png';
        const filePath = `${user.id}/${Date.now()}-${slugify(badgeState.achievementTitle)}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from('badges')
          .upload(filePath, badgeState.imageFile, { upsert: false });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('badges').getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('badges')
        .update({
          achievement_title: badgeState.achievementTitle.trim(),
          category_color: category.color,
          category_id: category.id,
          description: badgeState.description.trim(),
          image_url: imageUrl,
          name: `${category.name} - ${badgeState.achievementTitle.trim()}`,
        })
        .eq('id', badgeId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      await queryClient.invalidateQueries({ queryKey: ['all-badges'] });
      toast({
        title: 'Conquista atualizada',
        description: 'As alterações da conquista foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar conquista:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar a conquista.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="achievements-config-page space-y-8">
      <Card className={PANEL_CARD_CLASS}>
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-cyan-400" />
            Configurações de Conquistas
          </CardTitle>
          <p className="text-sm text-white/60">
            Organize categorias e cadastre novas conquistas em modais separados.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setCategoryModalView('create');
              setIsCategoryModalOpen(true);
            }}
            className={`${SUBTLE_CARD_CLASS} flex min-h-[180px] flex-col items-start justify-between p-6 text-left transition-colors hover:border-white/15`}
          >
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10">
                <Shapes className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Categorias</h3>
                <p className="mt-2 text-sm text-white/60">
                  Crie categorias novas ou edite as já cadastradas com nome e cor.
                </p>
              </div>
            </div>
            <span className="text-sm text-cyan-300">{categories.length} categoria(s)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBadgeModalView('create');
              setIsBadgeModalOpen(true);
            }}
            className={`${SUBTLE_CARD_CLASS} flex min-h-[180px] flex-col items-start justify-between p-6 text-left transition-colors hover:border-white/15`}
          >
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10">
                <Trophy className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Cadastrar conquista</h3>
                <p className="mt-2 text-sm text-white/60">
                  Abra o modal de lote para enviar imagens e cadastrar várias conquistas.
                </p>
              </div>
            </div>
            <span className="text-sm text-cyan-300">{filledDraftsCount} pronta(s) no lote</span>
          </button>
        </CardContent>
      </Card>

      <Card className={PANEL_CARD_CLASS}>
        <CardHeader>
          <CardTitle className="text-white">Conquistas cadastradas</CardTitle>
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
              {badges.map((badge) => {
                const category = badge.achievement_categories;
                const badgeColor = category?.color || badge.category_color || DEFAULT_BADGE_COLOR;

                return (
                  <Card
                    key={badge.id}
                    className={`${SUBTLE_CARD_CLASS} border`}
                    style={{ borderColor: hexToRgba(badgeColor, 0.42) }}
                  >
                    <CardContent className="flex h-full flex-col gap-4 p-5">
                      <div className="flex items-center gap-4">
                        <div
                          className="rounded-full border-2 p-1"
                          style={{
                            borderColor: hexToRgba(badgeColor, 0.9),
                            background: hexToRgba(badgeColor, 0.12),
                          }}
                        >
                          <img src={badge.image_url} alt={badge.name} className="h-16 w-16 rounded-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-white">{badge.name}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-white/60">{badge.description}</p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3">
                        <Badge
                          variant="outline"
                          className="border-white/10 text-white"
                          style={{
                            borderColor: hexToRgba(badgeColor, 0.45),
                            color: badgeColor,
                          }}
                        >
                          {category?.name || 'Sem categoria'}
                        </Badge>
                        <span className="text-xs text-white/45">{badge.achievement_title}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="client-surface-subtle rounded-3xl p-10 text-center text-white/60">
              Nenhuma conquista cadastrada ainda.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Categorias</DialogTitle>
            <DialogDescription>
              Crie uma categoria nova ou altere as categorias já cadastradas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 border-b border-white/8 pb-4">
            <Button
              type="button"
              onClick={() => setCategoryModalView('create')}
              className={categoryModalView === 'create' ? 'client-action-button' : 'client-back-button'}
            >
              Criar categoria
            </Button>
            <Button
              type="button"
              onClick={() => setCategoryModalView('edit')}
              className={categoryModalView === 'edit' ? 'client-action-button' : 'client-back-button'}
            >
              Editar categoria
            </Button>
          </div>

          {categoryModalView === 'create' ? (
            <div className="achievements-config-subtle rounded-3xl p-5">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_180px_auto]">
                <div className="space-y-2">
                  <Label className="text-white">Nome da categoria</Label>
                  <Input
                    value={categoryDraft.name}
                    onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ex: Lealdade"
                    className={DARK_INPUT_CLASS}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Cor da categoria</Label>
                  <div className="achievements-config-color-wrap flex items-center gap-3 rounded-2xl px-3 py-2">
                    <input
                      type="color"
                      value={categoryDraft.color}
                      onChange={(event) => setCategoryDraft((current) => ({ ...current, color: event.target.value }))}
                      className="achievements-config-color-picker h-10 w-12 cursor-pointer rounded-xl p-1"
                    />
                    <Input
                      value={categoryDraft.color}
                      onChange={(event) => setCategoryDraft((current) => ({ ...current, color: event.target.value }))}
                      className={`${DARK_INPUT_CLASS} uppercase`}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => createCategoryMutation.mutate()}
                    disabled={createCategoryMutation.isPending}
                    className="client-action-button w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {createCategoryMutation.isPending ? 'Salvando...' : 'Salvar categoria'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {categories.map((category) => {
                const currentValues = existingCategoryValues[category.id] ?? {
                  color: category.color,
                  name: category.name,
                };

                return (
                  <Card key={category.id} className={SUBTLE_CARD_CLASS}>
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-white">{category.name}</p>
                          <p className="text-xs text-white/50">Cor aplicada na borda da conquista desbloqueada.</p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-white/10 text-white"
                          style={{
                            borderColor: hexToRgba(currentValues.color, 0.45),
                            color: currentValues.color,
                          }}
                        >
                          {currentValues.color}
                        </Badge>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[1.1fr_180px]">
                        <div className="space-y-2">
                          <Label className="text-white">Nome</Label>
                          <Input
                            value={currentValues.name}
                            onChange={(event) =>
                              setExistingCategoryValues((current) => ({
                                ...current,
                                [category.id]: {
                                  ...currentValues,
                                  name: event.target.value,
                                },
                              }))
                            }
                            className={DARK_INPUT_CLASS}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Cor</Label>
                          <div className="achievements-config-color-wrap flex items-center gap-3 rounded-2xl px-3 py-2">
                            <input
                              type="color"
                              value={currentValues.color}
                              onChange={(event) =>
                                setExistingCategoryValues((current) => ({
                                  ...current,
                                  [category.id]: {
                                    ...currentValues,
                                    color: event.target.value,
                                  },
                                }))
                              }
                              className="achievements-config-color-picker h-10 w-12 cursor-pointer rounded-xl p-1"
                            />
                            <Input
                              value={currentValues.color}
                              onChange={(event) =>
                                setExistingCategoryValues((current) => ({
                                  ...current,
                                  [category.id]: {
                                    ...currentValues,
                                    color: event.target.value,
                                  },
                                }))
                              }
                              className={`${DARK_INPUT_CLASS} uppercase`}
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() =>
                          updateCategoryMutation.mutate({
                            categoryId: category.id,
                            color: currentValues.color,
                            name: currentValues.name,
                          })
                        }
                        disabled={updateCategoryMutation.isPending}
                        className="client-back-button w-full"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Salvar categoria
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isBadgeModalOpen} onOpenChange={setIsBadgeModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Conquistas</DialogTitle>
            <DialogDescription>
              Cadastre novas conquistas ou edite as já cadastradas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 border-b border-white/8 pb-4">
            <Button
              type="button"
              onClick={() => setBadgeModalView('create')}
              className={badgeModalView === 'create' ? 'client-action-button' : 'client-back-button'}
            >
              Cadastrar conquista
            </Button>
            <Button
              type="button"
              onClick={() => setBadgeModalView('edit')}
              className={badgeModalView === 'edit' ? 'client-action-button' : 'client-back-button'}
            >
              Editar conquista
            </Button>
          </div>

          {badgeModalView === 'create' ? (
            <>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => setDrafts((current) => [...current, createDraft(categories[0]?.id || '')])}
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

              <div className="grid gap-4 lg:grid-cols-2">
                {drafts.map((rawDraft, index) => {
                  const draft = ensureCategoryForNewDraft(rawDraft);
                  const selectedCategory = categoriesById.get(draft.categoryId);
                  const fullTitle = selectedCategory?.name
                    ? `${selectedCategory.name} - ${draft.achievementTitle || 'Nome da conquista'}`
                    : 'Selecione uma categoria';

                  return (
                    <Card key={draft.id} className={SUBTLE_CARD_CLASS}>
                      <CardContent className="space-y-5 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-white">Conquista {index + 1}</p>
                            <p className="text-xs text-white/50">{fullTitle}</p>
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
                              style={{
                                borderColor: hexToRgba(selectedCategory?.color || DEFAULT_BADGE_COLOR, 0.9),
                                background: hexToRgba(selectedCategory?.color || DEFAULT_BADGE_COLOR, 0.12),
                              }}
                            >
                              {draft.previewUrl ? (
                                <img
                                  src={draft.previewUrl}
                                  alt={draft.achievementTitle || 'Preview da conquista'}
                                  className="h-full w-full rounded-full object-cover"
                                />
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
                              <Label className="text-white">Categoria</Label>
                              <Select
                                value={draft.categoryId}
                                onValueChange={(value) => updateDraft(draft.id, { categoryId: value })}
                              >
                                <SelectTrigger className={`${DARK_INPUT_CLASS} achievements-config-select`}>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white">Nome da conquista</Label>
                              <Input
                                value={draft.achievementTitle}
                                onChange={(event) => updateDraft(draft.id, { achievementTitle: event.target.value })}
                                placeholder="Ex: 6 meses"
                                className={DARK_INPUT_CLASS}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white">Subtítulo</Label>
                              <Input
                                value={draft.subtitle}
                                onChange={(event) => updateDraft(draft.id, { subtitle: event.target.value })}
                                placeholder="Ex: Permaneça ativo por 180 dias"
                                className={DARK_INPUT_CLASS}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/50 px-4 py-3 text-sm text-white/65">
                <span>{filledDraftsCount} conquista(s) preparada(s) para salvar</span>
                <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                  Lote
                </Badge>
              </div>
            </>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {badges.map((badge) => {
                const badgeState = existingBadgeValues[badge.id];
                if (!badgeState) return null;

                const selectedCategory = categoriesById.get(badgeState.categoryId);
                const previewSrc = badgeState.previewUrl || badgeState.imageUrl;
                const fullTitle = selectedCategory?.name
                  ? `${selectedCategory.name} - ${badgeState.achievementTitle || 'Nome da conquista'}`
                  : badge.name;

                return (
                  <Card key={badge.id} className={SUBTLE_CARD_CLASS}>
                    <CardContent className="space-y-5 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-white">Editar conquista</p>
                          <p className="text-xs text-white/50">{fullTitle}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-white/10 text-white"
                          style={{
                            borderColor: hexToRgba(selectedCategory?.color || DEFAULT_BADGE_COLOR, 0.45),
                            color: selectedCategory?.color || DEFAULT_BADGE_COLOR,
                          }}
                        >
                          {selectedCategory?.name || 'Sem categoria'}
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex shrink-0 flex-col items-center gap-3">
                          <div
                            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2"
                            style={{
                              borderColor: hexToRgba(selectedCategory?.color || DEFAULT_BADGE_COLOR, 0.9),
                              background: hexToRgba(selectedCategory?.color || DEFAULT_BADGE_COLOR, 0.12),
                            }}
                          >
                            {previewSrc ? (
                              <img
                                src={previewSrc}
                                alt={badgeState.achievementTitle || 'Preview da conquista'}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <ImagePlus className="h-8 w-8 text-white/40" />
                            )}
                          </div>

                          <Label
                            htmlFor={`existing-badge-upload-${badge.id}`}
                            className="inline-flex cursor-pointer items-center rounded-xl border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] px-3 py-2 text-sm font-medium text-white shadow-lg shadow-black/30 transition-all hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)]"
                          >
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Trocar imagem
                          </Label>
                          <input
                            id={`existing-badge-upload-${badge.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => handleExistingBadgeImageChange(badge.id, event.target.files?.[0] || null)}
                          />
                        </div>

                        <div className="grid flex-1 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white">Categoria</Label>
                            <Select
                              value={badgeState.categoryId}
                              onValueChange={(value) => updateExistingBadge(badge.id, { categoryId: value })}
                            >
                              <SelectTrigger className={`${DARK_INPUT_CLASS} achievements-config-select`}>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white">Nome da conquista</Label>
                            <Input
                              value={badgeState.achievementTitle}
                              onChange={(event) => updateExistingBadge(badge.id, { achievementTitle: event.target.value })}
                              className={DARK_INPUT_CLASS}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white">Subtítulo</Label>
                            <Input
                              value={badgeState.description}
                              onChange={(event) => updateExistingBadge(badge.id, { description: event.target.value })}
                              className={DARK_INPUT_CLASS}
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => updateBadgeMutation.mutate(badge.id)}
                        disabled={updateBadgeMutation.isPending}
                        className="client-action-button w-full"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Salvar conquista
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
