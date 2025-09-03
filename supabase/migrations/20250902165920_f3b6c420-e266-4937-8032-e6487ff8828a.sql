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
      forms_completed = false  -- Reset formulários a cada renovação
  WHERE plan_id = 'c089425b-49a9-4a66-b6a4-345ff800790e'
  AND status = 'ativo'
  AND (
    expires_at IS NULL 
    OR expires_at <= now() + INTERVAL '5 days'  -- Renovar 5 dias antes do vencimento
  );
  
  -- Log para debug
  RAISE NOTICE 'Unlimited plans automatically maintained at %', now();
END;
$$;

-- Atualizar a função auto_reset_monthly_forms para sempre executar a manutenção de planos ilimitados
CREATE OR REPLACE FUNCTION public.auto_reset_monthly_forms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Primeiro, executar manutenção automática de planos ilimitados
  PERFORM public.auto_maintain_unlimited_plans();
  
  -- Reset activation for users where 30 days have passed, EXCETO usuários com plano ilimitado
  UPDATE public.profiles 
  SET activated = false,
      updated_at = now()
  WHERE activated = true 
  AND updated_at < (now() - INTERVAL '30 days')
  AND NOT public.has_unlimited_plan(id);
  
  -- Reset formulários para assinaturas ativas onde passaram 30 dias desde a última ativação
  -- EXCETO para usuários com plano ilimitado (eles são gerenciados pela função acima)
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

-- Trigger para executar automaticamente a manutenção a cada consulta das assinaturas
CREATE OR REPLACE FUNCTION public.trigger_unlimited_maintenance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Executar manutenção automática de planos ilimitados sempre que houver consulta
  PERFORM public.auto_maintain_unlimited_plans();
  RETURN NEW;
END;
$$;

-- Criar trigger que executa a manutenção sempre que uma assinatura é consultada
DROP TRIGGER IF EXISTS unlimited_maintenance_trigger ON public.client_subscriptions;
CREATE TRIGGER unlimited_maintenance_trigger
  BEFORE SELECT ON public.client_subscriptions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_unlimited_maintenance();