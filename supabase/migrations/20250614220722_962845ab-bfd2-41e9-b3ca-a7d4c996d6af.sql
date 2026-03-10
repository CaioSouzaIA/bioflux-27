
-- Adicionar foreign key entre client_subscriptions e profiles
ALTER TABLE public.client_subscriptions 
ADD CONSTRAINT fk_client_subscriptions_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
