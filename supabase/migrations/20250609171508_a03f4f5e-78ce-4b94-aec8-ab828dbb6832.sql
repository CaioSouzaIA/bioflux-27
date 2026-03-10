
-- Primeiro, vamos limpar os planos existentes e criar os novos
DELETE FROM public.subscription_plans;

-- Inserir os novos planos com as especificações corretas
INSERT INTO public.subscription_plans (name, max_plans, price) VALUES
('Bronze - Treino', 1, 27.90),
('Bronze - Dieta', 1, 27.90),
('Bronze - Treino + Dieta', 1, 47.90),
('Silver - Treino', 2, 37.90),
('Silver - Dieta', 2, 37.90),
('Silver - Treino + Dieta', 2, 67.90),
('Gold - Treino', 3, 67.90),
('Gold - Dieta', 3, 67.90),
('Gold - Treino + Dieta', 3, 97.90);

-- Adicionar colunas para controlar o uso mensal dos planos
ALTER TABLE public.client_subscriptions 
ADD COLUMN responses_used INTEGER DEFAULT 0,
ADD COLUMN last_reset_date TIMESTAMPTZ DEFAULT now();

-- Criar função para resetar contadores mensalmente
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.client_subscriptions 
  SET responses_used = 0, 
      last_reset_date = now()
  WHERE last_reset_date <= now() - INTERVAL '1 month';
END;
$$;
