
-- Remove políticas existentes para evitar conflitos.
DROP POLICY IF EXISTS "Everyone can view subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can create subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can update subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can delete subscription plans" ON public.subscription_plans;

-- Garante que a Segurança em Nível de Linha (RLS) está ativa.
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos os usuários autenticados vejam os planos.
CREATE POLICY "Everyone can view subscription plans" ON public.subscription_plans
  FOR SELECT TO authenticated USING (true);

-- Política para permitir que apenas administradores criem planos.
CREATE POLICY "Admins can create subscription plans" ON public.subscription_plans
  FOR INSERT WITH CHECK (public.get_current_user_role() = 'admin');

-- Política para permitir que apenas administradores atualizem planos.
CREATE POLICY "Admins can update subscription plans" ON public.subscription_plans
  FOR UPDATE USING (public.get_current_user_role() = 'admin');

-- Política para permitir que apenas administradores apaguem planos.
CREATE POLICY "Admins can delete subscription plans" ON public.subscription_plans
  FOR DELETE USING (public.get_current_user_role() = 'admin');
