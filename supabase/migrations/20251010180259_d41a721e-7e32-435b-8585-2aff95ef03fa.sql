-- Criar buckets de storage para badges e avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('badges', 'badges', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Adicionar coluna avatar_url na tabela profiles se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Criar tabela de badges (conquistas)
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela de conquistas dos usuários
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies para badges - todos podem ver
CREATE POLICY "Todos podem ver badges"
ON public.badges
FOR SELECT
USING (true);

-- Admins podem gerenciar badges
CREATE POLICY "Admins podem gerenciar badges"
ON public.badges
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- RLS Policies para user_achievements
CREATE POLICY "Usuários podem ver suas próprias conquistas"
ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todas as conquistas"
ON public.user_achievements
FOR SELECT
USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins podem gerenciar conquistas"
ON public.user_achievements
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Storage policies para badges
CREATE POLICY "Todos podem ver badges"
ON storage.objects
FOR SELECT
USING (bucket_id = 'badges');

CREATE POLICY "Admins podem fazer upload de badges"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'badges' AND get_current_user_role() = 'admin');

CREATE POLICY "Admins podem atualizar badges"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'badges' AND get_current_user_role() = 'admin');

CREATE POLICY "Admins podem deletar badges"
ON storage.objects
FOR DELETE
USING (bucket_id = 'badges' AND get_current_user_role() = 'admin');

-- Storage policies para avatars
CREATE POLICY "Todos podem ver avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem fazer upload de seu próprio avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem atualizar seu próprio avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem deletar seu próprio avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);