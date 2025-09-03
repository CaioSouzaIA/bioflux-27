-- Corrigir nome do plano ilimitado para manter consistência com o código
UPDATE subscription_plans 
SET name = 'Plano Ilimitado'
WHERE name = 'Ilimitado - Treino + Dieta';