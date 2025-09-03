-- Função para verificar se usuário tem plano ilimitado ativo
CREATE OR REPLACE FUNCTION public.has_unlimited_plan(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.client_subscriptions cs
    WHERE cs.user_id = user_id_param 
    AND cs.plan_id = 'c089425b-49a9-4a66-b6a4-345ff800790e'
    AND cs.status = 'ativo'
  );
END;
$$;

-- Função para manter usuários com plano ilimitado sempre ativos
CREATE OR REPLACE FUNCTION public.maintain_unlimited_plan_activation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Manter activated = true para usuários com plano ilimitado ativo
  UPDATE public.profiles 
  SET activated = true,
      updated_at = now()
  WHERE id IN (
    SELECT DISTINCT cs.user_id 
    FROM public.client_subscriptions cs
    WHERE cs.plan_id = 'c089425b-49a9-4a66-b6a4-345ff800790e'
    AND cs.status = 'ativo'
  );
  
  -- Log para debug
  RAISE NOTICE 'Unlimited plan users activation maintained at %', now();
END;
$$;

-- Atualizar a função de reset mensal para não afetar usuários com plano ilimitado
CREATE OR REPLACE FUNCTION public.auto_reset_monthly_forms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Primeiro, manter usuários com plano ilimitado sempre ativos
  PERFORM public.maintain_unlimited_plan_activation();
  
  -- Reset activation for users where 30 days have passed, EXCETO usuários com plano ilimitado
  UPDATE public.profiles 
  SET activated = false,
      updated_at = now()
  WHERE activated = true 
  AND updated_at < (now() - INTERVAL '30 days')
  AND NOT public.has_unlimited_plan(id);
  
  -- Reset formulários para assinaturas ativas onde passaram 30 dias desde a última ativação
  -- EXCETO para usuários com plano ilimitado
  UPDATE public.client_subscriptions 
  SET forms_completed = false,
      last_reset_date = now(),
      updated_at = now()
  WHERE status = 'ativo' 
  AND user_id IN (
    SELECT id FROM public.profiles 
    WHERE activated = false 
    AND updated_at >= (now() - INTERVAL '1 day') -- Recently deactivated
  )
  AND NOT public.has_unlimited_plan(user_id);
  
  -- Log para debug
  RAISE NOTICE 'Monthly activation and forms reset completed at %', now();
END;
$$;

-- Atualizar função para não expirar assinaturas de planos ilimitados
CREATE OR REPLACE FUNCTION public.update_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Primeiro, executar o reset automático mensal
  PERFORM public.auto_reset_monthly_forms();
  
  -- Atualizar assinaturas que expiraram EXCETO planos ilimitados
  UPDATE public.client_subscriptions 
  SET status = 'expirado',
      updated_at = now()
  WHERE status = 'ativo' 
  AND expires_at IS NOT NULL 
  AND expires_at < now()
  AND plan_id != 'c089425b-49a9-4a66-b6a4-345ff800790e'; -- Não expirar planos ilimitados
END;
$$;