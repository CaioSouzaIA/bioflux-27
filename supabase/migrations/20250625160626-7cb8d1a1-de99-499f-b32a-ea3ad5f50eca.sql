
-- Atualizar os preços dos planos para os novos valores anuais (divididos por 10)
UPDATE public.subscription_plans 
SET price = 29.70
WHERE name IN ('Standard - Treino', 'Standard - Dieta');

UPDATE public.subscription_plans 
SET price = 49.70
WHERE name = 'Standard - Treino + Dieta';

UPDATE public.subscription_plans 
SET price = 39.70
WHERE name IN ('Pro - Treino', 'Pro - Dieta');

UPDATE public.subscription_plans 
SET price = 59.70
WHERE name = 'Pro - Treino + Dieta';
