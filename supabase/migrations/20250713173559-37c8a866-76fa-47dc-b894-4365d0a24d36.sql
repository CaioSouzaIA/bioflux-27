-- Função para resetar formulários automaticamente a cada 30 dias a partir da assinatura
CREATE OR REPLACE FUNCTION public.auto_reset_monthly_forms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Função para expirar assinaturas apenas após 12 meses
CREATE OR REPLACE FUNCTION public.update_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Criar um trigger que chama a função de reset automático sempre que necessário
CREATE OR REPLACE FUNCTION public.check_and_reset_forms()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está consultando uma assinatura ativa, verificar se precisa resetar
  IF NEW.status = 'ativo' AND (
    -- Se nunca foi resetado e já passaram 30 dias da assinatura
    (NEW.last_reset_date IS NULL AND NEW.created_at < (now() - INTERVAL '30 days'))
    OR 
    -- Se já foi resetado e passaram 30 dias do último reset
    (NEW.last_reset_date IS NOT NULL AND NEW.last_reset_date < (now() - INTERVAL '30 dias'))
  ) THEN
    NEW.forms_completed = false;
    NEW.last_reset_date = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;