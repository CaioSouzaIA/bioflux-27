
-- Excluir a tabela form_leads que não será mais utilizada
DROP TABLE IF EXISTS public.form_leads;

-- Adicionar a coluna whatsapp na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Atualizar a função handle_new_user para incluir o whatsapp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, whatsapp, user_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'whatsapp', -- Adicionando o whatsapp
    CASE 
      WHEN NEW.email LIKE '%admin%' OR NEW.email = 'admin@bioflux.com' THEN 'admin'
      ELSE 'client'
    END
  );
  RETURN NEW;
END;
$$;
