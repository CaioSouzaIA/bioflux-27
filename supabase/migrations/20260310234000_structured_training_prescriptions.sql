ALTER TABLE public.training_prescriptions
  ALTER COLUMN file_path DROP NOT NULL,
  ALTER COLUMN file_name DROP NOT NULL;

ALTER TABLE public.training_prescriptions
  ADD COLUMN IF NOT EXISTS plan_name TEXT,
  ADD COLUMN IF NOT EXISTS plan_sequence INTEGER,
  ADD COLUMN IF NOT EXISTS generation_status TEXT NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS structured_plan JSONB,
  ADD COLUMN IF NOT EXISTS raw_plan_text TEXT,
  ADD COLUMN IF NOT EXISTS generation_payload JSONB,
  ADD COLUMN IF NOT EXISTS model_slug TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'training_prescriptions_generation_status_check'
  ) THEN
    ALTER TABLE public.training_prescriptions
      ADD CONSTRAINT training_prescriptions_generation_status_check
      CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed', 'archived'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_training_prescriptions_form_response'
  ) THEN
    ALTER TABLE public.training_prescriptions
      ADD CONSTRAINT fk_training_prescriptions_form_response
      FOREIGN KEY (form_response_id) REFERENCES public.form_responses(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.create_training_prescription(
  p_user_id UUID,
  p_form_response_id UUID,
  p_generation_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS public.training_prescriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next_sequence INTEGER;
  v_full_name TEXT;
  v_lock_key BIGINT;
  v_inserted public.training_prescriptions;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  v_lock_key := ('x' || SUBSTRING(md5(('training-' || p_user_id::text)), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT public.build_client_full_name(first_name, last_name)
  INTO v_full_name
  FROM public.profiles
  WHERE id = p_user_id;

  v_full_name := COALESCE(v_full_name, 'Cliente');

  SELECT COALESCE(MAX(plan_sequence), 0) + 1
  INTO v_next_sequence
  FROM public.training_prescriptions
  WHERE user_id = p_user_id;

  INSERT INTO public.training_prescriptions (
    user_id,
    form_response_id,
    plan_name,
    plan_sequence,
    generation_status,
    generation_payload,
    status
  )
  VALUES (
    p_user_id,
    p_form_response_id,
    FORMAT('Plano de treino %s - %s', v_next_sequence, v_full_name),
    v_next_sequence,
    'pending',
    COALESCE(p_generation_payload, '{}'::jsonb),
    'active'
  )
  RETURNING *
  INTO v_inserted;

  RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.create_training_prescription(UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_training_prescription(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_training_prescription(UUID, UUID, JSONB) TO service_role;

WITH sequenced AS (
  SELECT
    tp.id,
    ROW_NUMBER() OVER (
      PARTITION BY tp.user_id
      ORDER BY COALESCE(tp.created_at, now()), tp.id
    ) AS seq,
    public.build_client_full_name(p.first_name, p.last_name) AS full_name
  FROM public.training_prescriptions tp
  LEFT JOIN public.profiles p ON p.id = tp.user_id
)
UPDATE public.training_prescriptions tp
SET
  plan_sequence = COALESCE(tp.plan_sequence, sequenced.seq),
  plan_name = COALESCE(
    tp.plan_name,
    FORMAT('Plano de treino %s - %s', sequenced.seq, sequenced.full_name)
  ),
  generation_status = COALESCE(
    tp.generation_status,
    CASE
      WHEN tp.status = 'archived' THEN 'archived'
      WHEN tp.file_path IS NOT NULL THEN 'completed'
      ELSE 'pending'
    END
  ),
  completed_at = COALESCE(
    tp.completed_at,
    CASE
      WHEN tp.file_path IS NOT NULL THEN COALESCE(tp.updated_at, tp.created_at, now())
      ELSE NULL
    END
  ),
  updated_at = COALESCE(tp.updated_at, now())
FROM sequenced
WHERE sequenced.id = tp.id;

UPDATE public.training_prescriptions
SET generation_status = CASE
  WHEN status = 'archived' THEN 'archived'
  WHEN generation_status IS NULL OR generation_status = '' THEN 'completed'
  ELSE generation_status
END;

ALTER TABLE public.training_prescriptions
  ALTER COLUMN plan_name SET NOT NULL,
  ALTER COLUMN plan_sequence SET NOT NULL,
  ALTER COLUMN generation_status SET DEFAULT 'pending',
  ALTER COLUMN generation_status SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_prescriptions_user_sequence
  ON public.training_prescriptions(user_id, plan_sequence);

CREATE INDEX IF NOT EXISTS idx_training_prescriptions_generation_status
  ON public.training_prescriptions(generation_status);

CREATE INDEX IF NOT EXISTS idx_training_prescriptions_form_response_id
  ON public.training_prescriptions(form_response_id);

DROP TRIGGER IF EXISTS update_training_prescriptions_updated_at ON public.training_prescriptions;
CREATE TRIGGER update_training_prescriptions_updated_at
  BEFORE UPDATE ON public.training_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
