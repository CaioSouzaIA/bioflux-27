
-- Permite que o form_id seja opcional para leads que não se originam de um formulário (ex: cadastros diretos)
ALTER TABLE public.form_leads ALTER COLUMN form_id DROP NOT NULL;

-- Permite que o user_id seja opcional para leads que ainda não estão atribuídos a um administrador específico
ALTER TABLE public.form_leads ALTER COLUMN user_id DROP NOT NULL;
