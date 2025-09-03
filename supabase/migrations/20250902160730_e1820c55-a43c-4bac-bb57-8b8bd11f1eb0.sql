-- Add activated column to profiles table for monthly plan validation
ALTER TABLE public.profiles 
ADD COLUMN activated BOOLEAN NOT NULL DEFAULT false;

-- Update existing users to activated = true if they have active subscriptions
UPDATE public.profiles 
SET activated = true 
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM public.client_subscriptions 
  WHERE status = 'ativo'
);

-- Create function to check if user activation is expired (30 days)
CREATE OR REPLACE FUNCTION public.is_user_activation_expired(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id_param 
    AND activated = true 
    AND updated_at < (now() - INTERVAL '30 days')
  );
END;
$$;

-- Create function to reset user activation (for monthly renewal)
CREATE OR REPLACE FUNCTION public.reset_user_activation(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Reset activation and update timestamp
  UPDATE public.profiles 
  SET activated = false,
      updated_at = now()
  WHERE id = user_id_param 
  AND activated = true 
  AND updated_at < (now() - INTERVAL '30 days');
  
  -- Reset forms_completed for expired users
  UPDATE public.client_subscriptions 
  SET forms_completed = false,
      updated_at = now()
  WHERE user_id = user_id_param 
  AND status = 'ativo';
  
  RETURN FOUND;
END;
$$;

-- Update auto_reset_monthly_forms function to handle new activation logic
CREATE OR REPLACE FUNCTION public.auto_reset_monthly_forms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Reset activation for users where 30 days have passed
  UPDATE public.profiles 
  SET activated = false,
      updated_at = now()
  WHERE activated = true 
  AND updated_at < (now() - INTERVAL '30 days');
  
  -- Reset formulários para assinaturas ativas onde passaram 30 dias desde a última ativação
  UPDATE public.client_subscriptions 
  SET forms_completed = false,
      last_reset_date = now(),
      updated_at = now()
  WHERE status = 'ativo' 
  AND user_id IN (
    SELECT id FROM public.profiles 
    WHERE activated = false 
    AND updated_at >= (now() - INTERVAL '1 day') -- Recently deactivated
  );
  
  -- Log para debug
  RAISE NOTICE 'Monthly activation and forms reset completed at %', now();
END;
$$;