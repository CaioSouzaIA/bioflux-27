-- Adicionar coluna para controlar se o usuário já viu o modal de onboarding
ALTER TABLE public.profiles 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;