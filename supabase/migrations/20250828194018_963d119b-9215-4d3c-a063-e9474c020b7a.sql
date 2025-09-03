-- Fix remaining database functions with search_path security

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT user_type FROM public.profiles WHERE id = auth.uid()
$function$;

-- Fix get_admin_ids function  
CREATE OR REPLACE FUNCTION public.get_admin_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT array_agg(id) FROM public.profiles WHERE user_type = 'admin';
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, whatsapp, user_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'whatsapp',
    CASE 
      WHEN NEW.email LIKE '%admin%' OR NEW.email = 'admin@bioflux.com' THEN 'admin'
      ELSE 'client'
    END
  );
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user_type function
CREATE OR REPLACE FUNCTION public.handle_new_user_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  INSERT INTO public.user_types (user_id, user_type)
  VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$function$;

-- Fix update_expired_subscriptions function
CREATE OR REPLACE FUNCTION public.update_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Primeiro, executar o reset automático mensal
  PERFORM public.auto_reset_monthly_forms();
  
  -- Atualizar assinaturas que expiraram (apenas após 12 meses completos)
  UPDATE public.client_subscriptions 
  SET status = 'expirado',
      updated_at = now()
  WHERE status = 'ativo' 
  AND expires_at IS NOT NULL 
  AND expires_at < now();
END;
$function$;

-- Fix auto_reset_monthly_forms function
CREATE OR REPLACE FUNCTION public.auto_reset_monthly_forms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Resetar formulários para assinaturas ativas onde passaram 30 dias desde a assinatura
  UPDATE public.client_subscriptions 
  SET forms_completed = false,
      last_reset_date = now(),
      updated_at = now()
  WHERE status = 'ativo' 
  AND (
    -- Se nunca foi resetado e já passaram 30 dias da assinatura
    (last_reset_date IS NULL AND created_at < (now() - INTERVAL '30 days'))
    OR 
    -- Se já foi resetado e passaram 30 dias do último reset
    (last_reset_date IS NOT NULL AND last_reset_date < (now() - INTERVAL '30 days'))
  );
  
  -- Log para debug
  RAISE NOTICE 'Forms reset completed at %', now();
END;
$function$;

-- Fix cancel_client_subscription function
CREATE OR REPLACE FUNCTION public.cancel_client_subscription(subscription_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Input validation
  IF subscription_id IS NULL THEN
    RAISE EXCEPTION 'ID da assinatura é obrigatório';
  END IF;
  
  UPDATE public.client_subscriptions 
  SET status = 'cancelado'
  WHERE id = subscription_id 
  AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$function$;

-- Fix check_subscription_expiry trigger function
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Se a data de expiração passou e o status ainda é ativo, mudar para expirado
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < now() AND NEW.status = 'ativo' THEN
    NEW.status = 'expirado';
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix mark_forms_completed_on_prescription trigger function
CREATE OR REPLACE FUNCTION public.mark_forms_completed_on_prescription()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Marcar formulários como completados quando uma nova prescrição é criada
  UPDATE public.client_subscriptions 
  SET forms_completed = true,
      updated_at = now()
  WHERE user_id = NEW.user_id 
  AND status = 'ativo';
  
  RETURN NEW;
END;
$function$;

-- Fix cancel_previous_subscription trigger function
CREATE OR REPLACE FUNCTION public.cancel_previous_subscription()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Se a nova assinatura está sendo inserida como ativa
  IF NEW.status = 'ativo' THEN
    -- Cancelar todas as outras assinaturas ativas do mesmo usuário
    UPDATE public.client_subscriptions 
    SET status = 'cancelado', 
        updated_at = now()
    WHERE user_id = NEW.user_id 
    AND status = 'ativo' 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_metabolic_assessments_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_metabolic_assessments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_training_periodization_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_training_periodization_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix check_and_reset_forms trigger function
CREATE OR REPLACE FUNCTION public.check_and_reset_forms()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Se está consultando uma assinatura ativa, verificar se precisa resetar
  IF NEW.status = 'ativo' AND (
    -- Se nunca foi resetado e já passaram 30 dias da assinatura
    (NEW.last_reset_date IS NULL AND NEW.created_at < (now() - INTERVAL '30 days'))
    OR 
    -- Se já foi resetado e passaram 30 dias do último reset
    (NEW.last_reset_date IS NOT NULL AND NEW.last_reset_date < (now() - INTERVAL '30 days'))
  ) THEN
    NEW.forms_completed = false;
    NEW.last_reset_date = now();
  END IF;
  
  RETURN NEW;
END;
$function$;