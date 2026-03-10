ALTER TABLE public.badges
ADD COLUMN IF NOT EXISTS category_color text NOT NULL DEFAULT '#22D3EE';

UPDATE public.badges
SET category_color = '#22D3EE'
WHERE category_color IS NULL OR category_color = '';
