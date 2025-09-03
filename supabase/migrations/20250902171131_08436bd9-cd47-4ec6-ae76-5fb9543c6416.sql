-- Função para sincronizar dados de usuários com plano ilimitado
CREATE OR REPLACE FUNCTION public.sync_unlimited_plan_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Atualizar profiles: activated = true para usuários com plano ilimitado
  UPDATE public.profiles 
  SET activated = true,
      updated_at = now()
  WHERE id IN (
    SELECT DISTINCT cs.user_id 
    FROM public.client_subscriptions cs
    WHERE cs.plan_id = 'c089425b-49a9-4a66-b6a4-345ff800790e'
  );
  
  -- Atualizar client_subscriptions: status = 'ativo' para planos ilimitados
  UPDATE public.client_subscriptions 
  SET status = 'ativo',
      updated_at = now()
  WHERE plan_id = 'c089425b-49a9-4a66-b6a4-345ff800790e'
  AND status != 'ativo';
  
  -- Log para debug
  RAISE NOTICE 'Unlimited plan data synchronized at %', now();
END;
$$;

-- Função para verificar e corrigir dados de plano ilimitado em tempo real
CREATE OR REPLACE FUNCTION public.enforce_unlimited_plan_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Se é um plano ilimitado sendo inserido ou atualizado
  IF NEW.plan_id = 'c089425b-49a9-4a66-b6a4-345ff800790e' THEN
    -- Garantir que o status seja sempre 'ativo'
    NEW.status = 'ativo';
    
    -- Atualizar o profile para activated = true
    UPDATE public.profiles 
    SET activated = true,
        updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para aplicar automaticamente as regras do plano ilimitado
DROP TRIGGER IF EXISTS trigger_enforce_unlimited_plan ON public.client_subscriptions;
CREATE TRIGGER trigger_enforce_unlimited_plan
  BEFORE INSERT OR UPDATE ON public.client_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_unlimited_plan_status();

-- Executar sincronização inicial
SELECT public.sync_unlimited_plan_data();