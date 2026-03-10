ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS selected_badge_id uuid REFERENCES public.badges(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_selected_badge_id_idx
ON public.profiles (selected_badge_id);
