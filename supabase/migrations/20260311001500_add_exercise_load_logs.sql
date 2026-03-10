CREATE TABLE IF NOT EXISTS public.exercise_load_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  training_prescription_id UUID NOT NULL REFERENCES public.training_prescriptions(id) ON DELETE CASCADE,
  workout_label TEXT NOT NULL,
  workout_title TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  load_value NUMERIC(10,2) NOT NULL CHECK (load_value >= 0),
  load_unit TEXT NOT NULL CHECK (load_unit IN ('kg', 'lb', 'placas')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercise_load_logs_user_id
  ON public.exercise_load_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_exercise_load_logs_prescription_id
  ON public.exercise_load_logs(training_prescription_id);

CREATE INDEX IF NOT EXISTS idx_exercise_load_logs_latest
  ON public.exercise_load_logs(user_id, training_prescription_id, workout_label, exercise_name, created_at DESC);

ALTER TABLE public.exercise_load_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own exercise load logs" ON public.exercise_load_logs;
CREATE POLICY "Users can view their own exercise load logs"
  ON public.exercise_load_logs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own exercise load logs" ON public.exercise_load_logs;
CREATE POLICY "Users can insert their own exercise load logs"
  ON public.exercise_load_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all exercise load logs" ON public.exercise_load_logs;
CREATE POLICY "Admins can manage all exercise load logs"
  ON public.exercise_load_logs
  FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
