
-- Adicionar coluna user_type na tabela profiles (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'user_type') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN user_type TEXT NOT NULL DEFAULT 'client' 
        CHECK (user_type IN ('admin', 'client'));
    END IF;
END $$;

-- Atualizar a função handle_new_user para definir o tipo baseado no email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, user_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    CASE 
      WHEN NEW.email LIKE '%admin%' OR NEW.email = 'admin@bioflux.com' THEN 'admin'
      ELSE 'client'
    END
  );
  RETURN NEW;
END;
$$;
