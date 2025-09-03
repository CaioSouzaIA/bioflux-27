
-- Inserir o novo plano "Ilimitado" para treino e dieta (sem suplementação)
INSERT INTO public.subscription_plans (name, max_plans, price) VALUES
('Ilimitado - Treino', 999999, 0.00),
('Ilimitado - Dieta', 999999, 0.00),
('Ilimitado - Treino + Dieta', 999999, 0.00);
