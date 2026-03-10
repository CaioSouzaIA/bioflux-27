ALTER TABLE public.diet_prescriptions
  ALTER COLUMN file_path DROP NOT NULL,
  ALTER COLUMN file_name DROP NOT NULL;

ALTER TABLE public.diet_prescriptions
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
    WHERE conname = 'diet_prescriptions_generation_status_check'
  ) THEN
    ALTER TABLE public.diet_prescriptions
      ADD CONSTRAINT diet_prescriptions_generation_status_check
      CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed', 'archived'));
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.build_client_full_name(
  profile_first_name TEXT,
  profile_last_name TEXT,
  fallback_label TEXT DEFAULT 'Cliente'
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(BTRIM(CONCAT_WS(' ', profile_first_name, profile_last_name)), ''),
    fallback_label
  );
$$;

CREATE OR REPLACE FUNCTION public.create_diet_prescription(
  p_user_id UUID,
  p_form_response_id UUID,
  p_generation_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS public.diet_prescriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next_sequence INTEGER;
  v_full_name TEXT;
  v_lock_key BIGINT;
  v_inserted public.diet_prescriptions;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  v_lock_key := ('x' || SUBSTRING(md5(p_user_id::text), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT public.build_client_full_name(first_name, last_name)
  INTO v_full_name
  FROM public.profiles
  WHERE id = p_user_id;

  v_full_name := COALESCE(v_full_name, 'Cliente');

  SELECT COALESCE(MAX(plan_sequence), 0) + 1
  INTO v_next_sequence
  FROM public.diet_prescriptions
  WHERE user_id = p_user_id;

  INSERT INTO public.diet_prescriptions (
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
    FORMAT('Plano alimentar %s - %s', v_next_sequence, v_full_name),
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

REVOKE ALL ON FUNCTION public.create_diet_prescription(UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_diet_prescription(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_diet_prescription(UUID, UUID, JSONB) TO service_role;

WITH sequenced AS (
  SELECT
    dp.id,
    ROW_NUMBER() OVER (
      PARTITION BY dp.user_id
      ORDER BY COALESCE(dp.created_at, now()), dp.id
    ) AS seq,
    public.build_client_full_name(p.first_name, p.last_name) AS full_name
  FROM public.diet_prescriptions dp
  LEFT JOIN public.profiles p ON p.id = dp.user_id
)
UPDATE public.diet_prescriptions dp
SET
  plan_sequence = COALESCE(dp.plan_sequence, sequenced.seq),
  plan_name = COALESCE(
    dp.plan_name,
    FORMAT('Plano alimentar %s - %s', sequenced.seq, sequenced.full_name)
  ),
  generation_status = COALESCE(
    dp.generation_status,
    CASE
      WHEN dp.status = 'archived' THEN 'archived'
      WHEN dp.file_path IS NOT NULL THEN 'completed'
      ELSE 'pending'
    END
  ),
  completed_at = COALESCE(
    dp.completed_at,
    CASE
      WHEN dp.file_path IS NOT NULL THEN COALESCE(dp.updated_at, dp.created_at, now())
      ELSE NULL
    END
  ),
  updated_at = COALESCE(dp.updated_at, now())
FROM sequenced
WHERE sequenced.id = dp.id;

UPDATE public.diet_prescriptions
SET generation_status = CASE
  WHEN status = 'archived' THEN 'archived'
  WHEN generation_status IS NULL OR generation_status = '' THEN 'completed'
  ELSE generation_status
END;

ALTER TABLE public.diet_prescriptions
  ALTER COLUMN plan_name SET NOT NULL,
  ALTER COLUMN plan_sequence SET NOT NULL,
  ALTER COLUMN generation_status SET DEFAULT 'pending',
  ALTER COLUMN generation_status SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_diet_prescriptions_user_sequence
  ON public.diet_prescriptions(user_id, plan_sequence);

CREATE INDEX IF NOT EXISTS idx_diet_prescriptions_generation_status
  ON public.diet_prescriptions(generation_status);

CREATE INDEX IF NOT EXISTS idx_diet_prescriptions_form_response_id
  ON public.diet_prescriptions(form_response_id);

DROP TRIGGER IF EXISTS update_diet_prescriptions_updated_at ON public.diet_prescriptions;
CREATE TRIGGER update_diet_prescriptions_updated_at
  BEFORE UPDATE ON public.diet_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
