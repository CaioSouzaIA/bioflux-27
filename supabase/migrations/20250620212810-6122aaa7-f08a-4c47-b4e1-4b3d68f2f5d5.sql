
-- Adicionar coluna para controlar se o cliente já respondeu formulários no período atual
ALTER TABLE public.client_subscriptions 
ADD COLUMN IF NOT EXISTS forms_completed BOOLEAN NOT NULL DEFAULT false;

-- Criar função para resetar o status de formulários completados
CREATE OR REPLACE FUNCTION public.reset_client_forms(client_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Resetar o status de formulários completados para o cliente
  UPDATE public.client_subscriptions 
  SET forms_completed = false,
      updated_at = now()
  WHERE user_id = client_user_id 
  AND status = 'ativo';
  
  RETURN FOUND;
END;
$$;

-- Função para marcar formulários como completados quando uma prescrição é gerada
CREATE OR REPLACE FUNCTION public.mark_forms_completed_on_prescription()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar formulários como completados quando uma nova prescrição é criada
  UPDATE public.client_subscriptions 
  SET forms_completed = true,
      updated_at = now()
  WHERE user_id = NEW.user_id 
  AND status = 'ativo';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para marcar formulários como completados automaticamente
DROP TRIGGER IF EXISTS trigger_mark_forms_completed_diet ON public.diet_prescriptions;
CREATE TRIGGER trigger_mark_forms_completed_diet
  AFTER INSERT ON public.diet_prescriptions
  FOR EACH ROW EXECUTE FUNCTION mark_forms_completed_on_prescription();

DROP TRIGGER IF EXISTS trigger_mark_forms_completed_training ON public.training_prescriptions;
CREATE TRIGGER trigger_mark_forms_completed_training
  AFTER INSERT ON public.training_prescriptions
  FOR EACH ROW EXECUTE FUNCTION mark_forms_completed_on_prescription();
