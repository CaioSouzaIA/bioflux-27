
-- First, let's see what subscription plans currently exist and are being used
-- We'll update existing plans instead of deleting them to avoid foreign key violations

-- Update existing plans or insert new ones
-- First, let's clear any unused plans and update existing ones safely

-- Update Bronze plans to Standard
UPDATE public.subscription_plans 
SET name = 'Standard - Treino', max_plans = 1, price = 27.90
WHERE name LIKE '%Bronze%' AND name LIKE '%Treino%' AND name NOT LIKE '%Dieta%';

UPDATE public.subscription_plans 
SET name = 'Standard - Dieta', max_plans = 1, price = 27.90
WHERE name LIKE '%Bronze%' AND name LIKE '%Dieta%' AND name NOT LIKE '%Treino%';

UPDATE public.subscription_plans 
SET name = 'Standard - Treino + Dieta', max_plans = 1, price = 47.90
WHERE name LIKE '%Bronze%' AND (name LIKE '%Treino + Dieta%' OR name LIKE '%Dieta + Treino%');

-- Update Silver plans to Pro
UPDATE public.subscription_plans 
SET name = 'Pro - Treino', max_plans = 3, price = 37.90
WHERE name LIKE '%Silver%' AND name LIKE '%Treino%' AND name NOT LIKE '%Dieta%';

UPDATE public.subscription_plans 
SET name = 'Pro - Dieta', max_plans = 3, price = 37.90
WHERE name LIKE '%Silver%' AND name LIKE '%Dieta%' AND name NOT LIKE '%Treino%';

UPDATE public.subscription_plans 
SET name = 'Pro - Treino + Dieta', max_plans = 3, price = 67.90
WHERE name LIKE '%Silver%' AND (name LIKE '%Treino + Dieta%' OR name LIKE '%Dieta + Treino%');

-- Delete any Gold plans that are not being referenced
DELETE FROM public.subscription_plans 
WHERE name LIKE '%Gold%' 
AND id NOT IN (SELECT DISTINCT plan_id FROM public.client_subscriptions WHERE plan_id IS NOT NULL);

-- Insert any missing Standard plans if they don't exist
INSERT INTO public.subscription_plans (name, max_plans, price)
SELECT 'Standard - Treino', 1, 27.90
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Standard - Treino');

INSERT INTO public.subscription_plans (name, max_plans, price)
SELECT 'Standard - Dieta', 1, 27.90
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Standard - Dieta');

INSERT INTO public.subscription_plans (name, max_plans, price)
SELECT 'Standard - Treino + Dieta', 1, 47.90
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Standard - Treino + Dieta');

INSERT INTO public.subscription_plans (name, max_plans, price)
SELECT 'Pro - Treino', 3, 37.90
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Pro - Treino');

INSERT INTO public.subscription_plans (name, max_plans, price)
SELECT 'Pro - Dieta', 3, 37.90
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Pro - Dieta');

INSERT INTO public.subscription_plans (name, max_plans, price)
SELECT 'Pro - Treino + Dieta', 3, 67.90
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Pro - Treino + Dieta');
