-- Adicionar coluna para controlar se o cliente pode ver o plano ilimitado
ALTER TABLE public.profiles 
ADD COLUMN unlimited_plan_enabled boolean DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.unlimited_plan_enabled IS 'Controla se o cliente tem acesso ao plano ilimitado';