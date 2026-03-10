
-- Atualizar os preços dos planos para os novos valores do Ticto (divididos por 12)
UPDATE public.subscription_plans 
SET price = 30.72
WHERE name IN ('Standard - Treino', 'Standard - Dieta');

UPDATE public.subscription_plans 
SET price = 51.40
WHERE name = 'Standard - Treino + Dieta';

UPDATE public.subscription_plans 
SET price = 41.06
WHERE name IN ('Pro - Treino', 'Pro - Dieta');

UPDATE public.subscription_plans 
SET price = 61.74
WHERE name = 'Pro - Treino + Dieta';
