import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string | null;
  userName: string;
  userWhatsapp?: string;
}

export function AvatarUpload({ open, onOpenChange, currentAvatarUrl, userName, userWhatsapp }: AvatarUploadProps) {
  const { user } = useAuthContext();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);

  const getUserInitials = () => {
    const names = userName.split(" ");
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return userName.charAt(0).toUpperCase();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione uma imagem válida.",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload para o Supabase Storage
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

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar perfil com URL do avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Sucesso!",
        description: "Foto de perfil atualizada com sucesso.",
      });

      // Recarregar a página para atualizar o avatar em todos os lugares
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a foto de perfil.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-black text-white shadow-2xl shadow-black/60">
        <DialogHeader>
          <DialogTitle className="text-white">Meu Perfil</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          <Avatar className="h-32 w-32 border-4 border-gray-700">
            <AvatarImage src={previewUrl || undefined} />
            <AvatarFallback className="text-2xl bg-gray-800 text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="w-full space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Nome</p>
              <p className="mt-1 text-sm font-medium text-white">{userName}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">WhatsApp</p>
              <p className="mt-1 text-sm font-medium text-white">{userWhatsapp || "Nao informado"}</p>
            </div>

            <div className="flex flex-col items-center gap-3 w-full">
            <label htmlFor="avatar-upload">
              <Button
                type="button"
                disabled={uploading}
                className="cursor-pointer border border-white/10 bg-[linear-gradient(135deg,#050505_0%,#1a1a1a_48%,#3a3a3a_100%)] text-white shadow-lg shadow-black/30 hover:bg-[linear-gradient(135deg,#101010_0%,#262626_48%,#4a4a4a_100%)]"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Escolher Foto
                  </>
                )}
              </Button>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <p className="text-xs text-gray-400 text-center">
              PNG, JPG ou WEBP (máx. 5MB)
            </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
