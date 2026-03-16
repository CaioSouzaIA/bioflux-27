CREATE TABLE IF NOT EXISTS public.ai_agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT NOT NULL CHECK (
    agent_key IN ('diet_generation', 'training_generation', 'training_readaptation', 'training_periodization')
  ),
  agent_label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  source_function TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'generation',
  user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  prescription_id UUID NULL,
  form_response_id UUID NULL REFERENCES public.form_responses(id) ON DELETE SET NULL,
  model_slug TEXT NULL,
  duration_ms INTEGER NULL,
  prompt_commit_name TEXT NULL,
  secondary_prompt_commit_name TEXT NULL,
  error_message TEXT NULL,
  metadata JSONB NULL DEFAULT '{}'::jsonb,
  request_payload JSONB NULL DEFAULT '{}'::jsonb,
  response_payload JSONB NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_execution_logs_created_at
  ON public.ai_agent_execution_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_agent_execution_logs_agent_key_created_at
  ON public.ai_agent_execution_logs(agent_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_agent_execution_logs_status_created_at
  ON public.ai_agent_execution_logs(status, created_at DESC);

ALTER TABLE public.ai_agent_execution_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view ai agent execution logs" ON public.ai_agent_execution_logs;
CREATE POLICY "Admins can view ai agent execution logs"
  ON public.ai_agent_execution_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.user_type = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.mark_forms_completed_on_prescription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_unlimited_access BOOLEAN := false;
BEGIN
  SELECT
    COALESCE(p.unlimited_plan_enabled, false)
    OR EXISTS (
      SELECT 1
      FROM public.client_subscriptions cs
      JOIN public.subscription_plans sp ON sp.id = cs.plan_id
      WHERE cs.user_id = NEW.user_id
        AND cs.status = 'ativo'
        AND sp.name ILIKE '%ilimitado%'
    )
  INTO has_unlimited_access
  FROM public.profiles p
  WHERE p.id = NEW.user_id;

  IF has_unlimited_access THEN
    UPDATE public.client_subscriptions
    SET
      forms_completed = false,
      updated_at = now()
    WHERE user_id = NEW.user_id
      AND status = 'ativo';

    RETURN NEW;
  END IF;

  UPDATE public.client_subscriptions
  SET
    forms_completed = true,
    updated_at = now()
  WHERE user_id = NEW.user_id
    AND status = 'ativo';

  RETURN NEW;
END;
$$;

UPDATE public.client_subscriptions cs
SET
  forms_completed = false,
  updated_at = now()
FROM public.subscription_plans sp
WHERE sp.id = cs.plan_id
  AND cs.status = 'ativo'
  AND (
    sp.name ILIKE '%ilimitado%'
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = cs.user_id
        AND p.unlimited_plan_enabled = true
    )
  );
