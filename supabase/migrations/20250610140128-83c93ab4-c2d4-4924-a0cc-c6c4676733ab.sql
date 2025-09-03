
-- Primeiro, vamos verificar e limpar dados duplicados na tabela client_subscriptions
-- Remover assinaturas duplicadas, mantendo apenas a mais recente para cada usuário
DELETE FROM public.client_subscriptions 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.client_subscriptions
    ORDER BY user_id, created_at DESC
);

-- Adicionar constraint única para garantir que um usuário tenha apenas uma assinatura ativa
-- Primeiro removemos a constraint antiga se existir
ALTER TABLE public.client_subscriptions 
DROP CONSTRAINT IF EXISTS unique_active_subscription_per_user;

-- Adicionar nova constraint única para user_id quando status = 'ativo'
CREATE UNIQUE INDEX unique_active_subscription_per_user 
ON public.client_subscriptions (user_id) 
WHERE status = 'ativo';

-- Criar função para cancelar assinatura anterior quando uma nova for criada
CREATE OR REPLACE FUNCTION cancel_previous_subscription()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função
DROP TRIGGER IF EXISTS trigger_cancel_previous_subscription ON public.client_subscriptions;
CREATE TRIGGER trigger_cancel_previous_subscription
  BEFORE INSERT OR UPDATE ON public.client_subscriptions
  FOR EACH ROW EXECUTE FUNCTION cancel_previous_subscription();

-- Adicionar coluna updated_at se não existir
ALTER TABLE public.client_subscriptions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_client_subscriptions_updated_at ON public.client_subscriptions;
CREATE TRIGGER update_client_subscriptions_updated_at
  BEFORE UPDATE ON public.client_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
