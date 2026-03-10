import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Pencil, Save } from "lucide-react";

interface AvatarUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  userWhatsapp?: string | null;
  onProfileUpdated?: (profile: { first_name: string | null; last_name: string | null; whatsapp: string | null; avatar_url?: string | null }) => void;
}

export function AvatarUpload({
  open,
  onOpenChange,
  currentAvatarUrl,
  firstName,
  lastName,
  userWhatsapp,
  onProfileUpdated,
}: AvatarUploadProps) {
  const { user } = useAuthContext();
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [profileFirstName, setProfileFirstName] = useState(firstName || '');
  const [profileLastName, setProfileLastName] = useState(lastName || '');
  const [profileWhatsapp, setProfileWhatsapp] = useState(userWhatsapp || '');

  useEffect(() => {
    setPreviewUrl(currentAvatarUrl || null);
    setProfileFirstName(firstName || '');
    setProfileLastName(lastName || '');
    setProfileWhatsapp(userWhatsapp || '');
    setIsEditingProfile(false);
  }, [currentAvatarUrl, firstName, lastName, userWhatsapp, open]);

  const getUserInitials = () => {
    const fullName = `${profileFirstName} ${profileLastName}`.trim();
    if (!fullName) return 'U';

    const names = fullName.split(' ').filter(Boolean);
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }

    return fullName.charAt(0).toUpperCase();
  };

  const handleProfileSave = async () => {
    if (!user) return;

    try {
      setSavingProfile(true);

      const updates = {
        first_name: profileFirstName.trim() || null,
        last_name: profileLastName.trim() || null,
        whatsapp: profileWhatsapp.trim() || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      onProfileUpdated?.({
        ...updates,
        avatar_url: previewUrl,
      });

      setIsEditingProfile(false);
      toast({
        title: 'Perfil atualizado',
        description: 'Nome e WhatsApp foram salvos com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel salvar os dados do perfil.',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erro',
          description: 'Por favor, selecione uma imagem valida.',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description: 'A imagem deve ter no maximo 5MB.',
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      setPreviewUrl(publicUrl);
      onProfileUpdated?.({
        first_name: profileFirstName.trim() || null,
        last_name: profileLastName.trim() || null,
        whatsapp: profileWhatsapp.trim() || null,
        avatar_url: publicUrl,
      });

      toast({
        title: 'Sucesso!',
        description: 'Foto de perfil atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel atualizar a foto de perfil.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-black text-white shadow-2xl shadow-black/60 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Meu Perfil</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-gray-700">
              <AvatarImage src={previewUrl || undefined} />
              <AvatarFallback className="bg-gray-800 text-2xl text-white">{getUserInitials()}</AvatarFallback>
            </Avatar>

            <button
              type="button"
              disabled={uploading}
              onClick={() => document.getElementById('avatar-upload')?.click()}
              className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] text-white shadow-lg shadow-black/30 transition-all hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </button>

            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </div>

          <p className="text-center text-xs text-gray-400">PNG, JPG ou WEBP (max. 5MB)</p>

          <div className="w-full space-y-4">
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="client-back-button h-9 px-3 text-xs"
                onClick={() => setIsEditingProfile((current) => !current)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {isEditingProfile ? 'Cancelar edicao' : 'Editar perfil'}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/70">Nome</Label>
                {isEditingProfile ? (
                  <Input
                    value={profileFirstName}
                    onChange={(event) => setProfileFirstName(event.target.value)}
                    className="client-input-surface !text-black placeholder:text-black/45"
                    placeholder="Primeiro nome"
                  />
                ) : (
                  <div className="client-surface-subtle rounded-2xl px-4 py-3 text-sm font-medium text-white">
                    {profileFirstName || 'Nao informado'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Sobrenome</Label>
                {isEditingProfile ? (
                  <Input
                    value={profileLastName}
                    onChange={(event) => setProfileLastName(event.target.value)}
                    className="client-input-surface !text-black placeholder:text-black/45"
                    placeholder="Sobrenome"
                  />
                ) : (
                  <div className="client-surface-subtle rounded-2xl px-4 py-3 text-sm font-medium text-white">
                    {profileLastName || 'Nao informado'}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">WhatsApp</Label>
              {isEditingProfile ? (
                <Input
                  value={profileWhatsapp}
                  onChange={(event) => setProfileWhatsapp(event.target.value)}
                  className="client-input-surface !text-black placeholder:text-black/45"
                  placeholder="DDD + numero"
                />
              ) : (
                <div className="client-surface-subtle rounded-2xl px-4 py-3 text-sm font-medium text-white">
                  {profileWhatsapp || 'Nao informado'}
                </div>
              )}
            </div>

            {isEditingProfile && (
              <Button
                type="button"
                onClick={handleProfileSave}
                disabled={savingProfile}
                className="client-action-button w-full"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar alteracoes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
