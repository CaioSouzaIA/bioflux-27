CREATE TABLE IF NOT EXISTS public.achievement_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#22D3EE',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievement_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'achievement_categories'
      AND policyname = 'Admins podem ver categorias de conquistas'
  ) THEN
    CREATE POLICY "Admins podem ver categorias de conquistas"
    ON public.achievement_categories
    FOR SELECT
    USING (get_current_user_role() = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'achievement_categories'
      AND policyname = 'Admins podem gerenciar categorias de conquistas'
  ) THEN
    CREATE POLICY "Admins podem gerenciar categorias de conquistas"
    ON public.achievement_categories
    FOR ALL
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');
  END IF;
END $$;

INSERT INTO public.achievement_categories (name, color)
VALUES ('Geral', '#22D3EE')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.badges
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.achievement_categories(id),
ADD COLUMN IF NOT EXISTS achievement_title text;

INSERT INTO public.achievement_categories (name, color)
SELECT DISTINCT
  trim(split_part(name, ' - ', 1)) AS category_name,
  COALESCE(NULLIF(category_color, ''), '#22D3EE') AS color
FROM public.badges
WHERE name LIKE '% - %'
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;

UPDATE public.badges
SET achievement_title = CASE
  WHEN name LIKE '% - %' THEN trim(regexp_replace(name, '^[^-]+ -\s*', ''))
  ELSE trim(name)
END
WHERE achievement_title IS NULL;

UPDATE public.badges b
SET category_id = c.id
FROM public.achievement_categories c
WHERE b.category_id IS NULL
  AND c.name = CASE
    WHEN b.name LIKE '% - %' THEN trim(split_part(b.name, ' - ', 1))
    ELSE 'Geral'
  END;

UPDATE public.badges b
SET category_id = c.id
FROM public.achievement_categories c
WHERE b.category_id IS NULL
  AND c.name = 'Geral';

UPDATE public.badges b
SET name = c.name || ' - ' || COALESCE(NULLIF(trim(b.achievement_title), ''), trim(b.name)),
    category_color = c.color
FROM public.achievement_categories c
WHERE b.category_id = c.id;

ALTER TABLE public.badges
ALTER COLUMN category_id SET NOT NULL,
ALTER COLUMN achievement_title SET NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_badge_category_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  selected_category public.achievement_categories%ROWTYPE;
BEGIN
  SELECT *
  INTO selected_category
  FROM public.achievement_categories
  WHERE id = NEW.category_id;

  IF selected_category.id IS NULL THEN
    RAISE EXCEPTION 'Categoria de conquista inválida';
  END IF;

  NEW.achievement_title := COALESCE(NULLIF(trim(NEW.achievement_title), ''), 'Sem título');
  NEW.category_color := selected_category.color;
  NEW.name := selected_category.name || ' - ' || NEW.achievement_title;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS badges_sync_category_fields ON public.badges;

CREATE TRIGGER badges_sync_category_fields
BEFORE INSERT OR UPDATE OF category_id, achievement_title
ON public.badges
FOR EACH ROW
EXECUTE FUNCTION public.sync_badge_category_fields();

CREATE OR REPLACE FUNCTION public.sync_badges_after_category_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.badges
  SET category_color = NEW.color,
      name = NEW.name || ' - ' || achievement_title
  WHERE category_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS achievement_categories_sync_badges ON public.achievement_categories;

CREATE TRIGGER achievement_categories_sync_badges
AFTER UPDATE OF name, color
ON public.achievement_categories
FOR EACH ROW
EXECUTE FUNCTION public.sync_badges_after_category_update();
