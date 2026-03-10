
-- Habilitar RLS e definir políticas de segurança para múltiplas tabelas.

-- 1. Proteger a tabela diet_prescriptions
ALTER TABLE public.diet_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias prescrições de dieta"
  ON public.diet_prescriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias prescrições de dieta"
  ON public.diet_prescriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Admins podem gerenciar todas as prescrições de dieta"
  ON public.diet_prescriptions FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- 2. Proteger a tabela training_prescriptions
ALTER TABLE public.training_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias prescrições de treino"
  ON public.training_prescriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias prescrições de treino"
  ON public.training_prescriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar todas as prescrições de treino"
  ON public.training_prescriptions FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- 3. Proteger a tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
  
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.get_current_user_role() = 'admin');

-- 4. Proteger a tabela client_subscriptions
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias assinaturas"
  ON public.client_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar todas as assinaturas"
  ON public.client_subscriptions FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- 5. Proteger a tabela user_forms
ALTER TABLE public.user_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver todos os formulários"
  ON public.user_forms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Donos podem criar seus próprios formulários"
  ON public.user_forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Donos podem atualizar seus próprios formulários"
  ON public.user_forms FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Donos podem deletar seus próprios formulários"
  ON public.user_forms FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Proteger a tabela form_leads
ALTER TABLE public.form_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar seus próprios leads"
  ON public.form_leads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
