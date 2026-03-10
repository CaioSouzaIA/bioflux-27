
-- Atualizar a categoria 'anamnese' para 'anamnese-dieta' na tabela user_forms
UPDATE user_forms 
SET category = 'anamnese-dieta' 
WHERE category = 'anamnese';

-- Criar tabela para armazenar os planos assinados pelos leads
CREATE TABLE public.lead_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES form_leads(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('dieta', 'treino', 'dieta-treino')),
  plan_duration TEXT NOT NULL CHECK (plan_duration IN ('mensal', 'trimestral', 'anual')),
  subscription_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'expirado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para a tabela lead_subscriptions
ALTER TABLE public.lead_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para visualizar assinaturas (baseada no user_id do lead)
CREATE POLICY "Users can view subscriptions of their leads" 
  ON public.lead_subscriptions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM form_leads 
      WHERE form_leads.id = lead_subscriptions.lead_id 
      AND form_leads.user_id = auth.uid()
    )
  );

-- Política para inserir assinaturas
CREATE POLICY "Users can create subscriptions for their leads" 
  ON public.lead_subscriptions 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM form_leads 
      WHERE form_leads.id = lead_subscriptions.lead_id 
      AND form_leads.user_id = auth.uid()
    )
  );

-- Política para atualizar assinaturas
CREATE POLICY "Users can update subscriptions of their leads" 
  ON public.lead_subscriptions 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM form_leads 
      WHERE form_leads.id = lead_subscriptions.lead_id 
      AND form_leads.user_id = auth.uid()
    )
  );

-- Política para deletar assinaturas
CREATE POLICY "Users can delete subscriptions of their leads" 
  ON public.lead_subscriptions 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM form_leads 
      WHERE form_leads.id = lead_subscriptions.lead_id 
      AND form_leads.user_id = auth.uid()
    )
  );
