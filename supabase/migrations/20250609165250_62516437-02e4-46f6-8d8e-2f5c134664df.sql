
-- Criar tabela para planos de assinatura
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  max_plans INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir os planos disponíveis
INSERT INTO public.subscription_plans (name, max_plans, price) VALUES
('Bronze', 1, 29.90),
('Silver', 2, 49.90),
('Gold', 3, 79.90);

-- Criar tabela para assinaturas dos clientes
CREATE TABLE public.client_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('treino', 'dieta', 'treino-dieta')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'expirado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, plan_id, service_type)
);

-- Criar tabela para tipos de usuário
CREATE TABLE public.user_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_type TEXT NOT NULL DEFAULT 'client' CHECK (user_type IN ('admin', 'client')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscription_plans (todos podem ler)
CREATE POLICY "Everyone can view subscription plans" ON public.subscription_plans
  FOR SELECT TO authenticated USING (true);

-- Políticas RLS para client_subscriptions (usuários só veem suas próprias assinaturas)
CREATE POLICY "Users can view own subscriptions" ON public.client_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.client_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.client_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para user_types
CREATE POLICY "Users can view own user type" ON public.user_types
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user type" ON public.user_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user type" ON public.user_types
  FOR UPDATE USING (auth.uid() = user_id);

-- Função para criar tipo de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_types (user_id, user_type)
  VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;

-- Trigger para criar tipo de usuário automaticamente
CREATE TRIGGER on_auth_user_created_type
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_type();
