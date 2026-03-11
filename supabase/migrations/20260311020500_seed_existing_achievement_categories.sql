INSERT INTO public.achievement_categories (name, color)
VALUES
  ('Lealdade', '#00eeff'),
  ('Mestres do Ferro', '#543c3c')
ON CONFLICT (name) DO UPDATE
SET color = EXCLUDED.color;

UPDATE public.badges b
SET category_id = c.id,
    achievement_title = CASE
      WHEN b.name ILIKE 'Lealdade - 1 Mês%' THEN '1 Mês'
      WHEN b.name ILIKE 'Lealdade - 3 Meses%' THEN '3 Meses'
      WHEN b.name ILIKE 'Lealdade - 6 Meses%' THEN '6 Meses'
      WHEN b.name ILIKE 'Lealdade - 1 Ano%' THEN '1 Ano'
      WHEN b.name ILIKE 'Lealdade - 3 Anos%' THEN '3 Anos'
      ELSE COALESCE(NULLIF(trim(b.achievement_title), ''), trim(regexp_replace(b.name, '^Lealdade -\\s*', '')))
    END
FROM public.achievement_categories c
WHERE c.name = 'Lealdade'
  AND (
    b.name ILIKE 'Lealdade - %'
    OR (b.metadata ->> 'type') = 'account_age'
  );

UPDATE public.badges b
SET category_id = c.id,
    achievement_title = CASE
      WHEN b.name ILIKE '%Mestre do Ferro I%' THEN 'I'
      WHEN b.name ILIKE '%Mestre do Ferro II%' THEN 'II'
      WHEN b.name ILIKE '%Mestre do Ferro III%' THEN 'III'
      WHEN b.name ILIKE '%Mestre do Ferro IV%' THEN 'IV'
      WHEN b.name ILIKE '%Mestre do Ferro V%' THEN 'V'
      ELSE COALESCE(NULLIF(trim(b.achievement_title), ''), trim(regexp_replace(b.name, '^(Geral -\\s*)?Mestre[s]? do Ferro\\s*', '')))
    END
FROM public.achievement_categories c
WHERE c.name = 'Mestres do Ferro'
  AND (
    b.name ILIKE '%Mestre do Ferro%'
    OR (b.metadata ->> 'type') = 'workout_checkins'
  );

UPDATE public.achievement_categories
SET color = '#00eeff'
WHERE name = 'Lealdade';

UPDATE public.achievement_categories
SET color = '#543c3c'
WHERE name = 'Mestres do Ferro';

UPDATE public.badges b
SET category_color = c.color,
    name = c.name || ' - ' || b.achievement_title
FROM public.achievement_categories c
WHERE b.category_id = c.id
  AND c.name IN ('Lealdade', 'Mestres do Ferro');

DELETE FROM public.achievement_categories c
WHERE c.name = 'Geral'
  AND NOT EXISTS (
    SELECT 1
    FROM public.badges b
    WHERE b.category_id = c.id
  );
