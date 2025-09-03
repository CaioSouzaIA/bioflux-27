-- Função para manter usuários com plano ilimitado sempre ativos automaticamente
CREATE OR REPLACE FUNCTION public.auto_maintain_unlimited_plans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Sempre manter activated = true para usuários com plano ilimitado ativo
  UPDATE public.profiles 
  SET activated = true,
      updated_at = now()
  WHERE id IN (
    SELECT DISTINCT cs.user_id 
    FROM public.client_subscriptions cs
    WHERE cs.plan_id = 'c089425b-49a9-4a66-b6a4-345ff800790e'
    AND cs.status = 'ativo'
  );
  
  -- Renovar automaticamente assinaturas ilimitadas que estão próximas do vencimento
  -- ou que já venceram (adicionando mais 30 dias)
  UPDATE public.client_subscriptions 
  SET expires_at = now() + INTERVAL '30 days',
      updated_at = now(),
      last_reset_date = now(),
      forms_completed = false -- Reset formulários a cada renovação  
  WHERE plan_id = 'c089425b-49a9-4a66-b6a4-345ff800790e'
  AND status = 'ativo'
  AND (
    expires_at IS NULL 
    OR expires_at <= now() + INTERVAL '5 days' -- Renovar 5 dias antes do vencimento
  );
  
  -- Log para debug
  RAISE NOTICE 'Unlimited plans automatically maintained at %', now();
END;
$$;

-- Atualizar a função update_expired_subscriptions para sempre executar a manutenção de planos ilimitados
CREATE OR REPLACE FUNCTION public.update_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Primeiro, executar manutenção automática de planos ilimitados
  PERFORM public.auto_maintain_unlimited_plans();
  
  -- Executar reset automático mensal
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