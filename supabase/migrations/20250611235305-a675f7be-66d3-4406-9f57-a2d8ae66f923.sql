
-- Adicionar coluna user_id à tabela form_responses
ALTER TABLE public.form_responses 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Habilitar RLS na tabela form_responses
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam suas próprias respostas
CREATE POLICY "Users can view their own form responses" 
  ON public.form_responses 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para permitir que usuários criem suas próprias respostas
CREATE POLICY "Users can create their own form responses" 
  ON public.form_responses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que administradores vejam todas as respostas
CREATE POLICY "Admins can view all form responses" 
  ON public.form_responses 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- Política para permitir que administradores criem respostas
CREATE POLICY "Admins can create form responses" 
  ON public.form_responses 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );
