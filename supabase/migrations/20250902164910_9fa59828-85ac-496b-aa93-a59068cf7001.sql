-- Atualizar valores dos planos conforme nova tabela de preços
UPDATE subscription_plans 
SET price = 29.90 
WHERE name IN ('Standard - Dieta', 'Standard - Treino');

UPDATE subscription_plans 
SET price = 39.90 
WHERE name IN ('Standard - Treino + Dieta', 'Pro - Treino', 'Pro - Dieta');

UPDATE subscription_plans 
SET price = 49.90 
WHERE name = 'Pro - Treino + Dieta';