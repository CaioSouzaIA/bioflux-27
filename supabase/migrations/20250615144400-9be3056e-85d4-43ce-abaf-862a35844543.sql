
-- Adicionar políticas de segurança para a tabela form_responses
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar respostas de seus formulários"
  ON public.form_responses
  FOR ALL
  USING (
    (public.get_current_user_role() = 'admin') AND
    (EXISTS (
      SELECT 1 FROM public.user_forms uf
      WHERE uf.id = form_responses.form_id AND uf.user_id = auth.uid()
    ))
  )
  WITH CHECK (
    (public.get_current_user_role() = 'admin') AND
    (EXISTS (
      SELECT 1 FROM public.user_forms uf
      WHERE uf.id = form_responses.form_id AND uf.user_id = auth.uid()
    ))
  );

CREATE POLICY "Clientes podem visualizar suas próprias respostas"
  ON public.form_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Permitir a criação de novas respostas de formulário"
  ON public.form_responses
  FOR INSERT
  WITH CHECK (true);

-- Criar função para buscar IDs de admin de forma segura
CREATE OR REPLACE FUNCTION get_admin_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT array_agg(id) FROM public.profiles WHERE user_type = 'admin';
$$;
