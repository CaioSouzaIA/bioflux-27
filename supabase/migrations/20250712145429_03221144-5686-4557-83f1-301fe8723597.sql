-- Criar função para verificar e atualizar assinaturas expiradas
CREATE OR REPLACE FUNCTION public.update_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar assinaturas que expiraram
  UPDATE public.client_subscriptions 
  SET status = 'expirado',
      updated_at = now()
  WHERE status = 'ativo' 
  AND expires_at IS NOT NULL 
  AND expires_at < now();
END;
$$;

-- Criar trigger para executar automaticamente quando verificamos assinaturas
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se a data de expiração passou e o status ainda é ativo, mudar para expirado
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < now() AND NEW.status = 'ativo' THEN
    NEW.status = 'expirado';
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que verifica na atualização
CREATE TRIGGER check_expiry_on_update
  BEFORE UPDATE ON public.client_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_subscription_expiry();