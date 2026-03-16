INSERT INTO public.subscription_plans (name, max_plans, price)
SELECT 'Free - Teste', 2, 0.00
WHERE NOT EXISTS (
  SELECT 1
  FROM public.subscription_plans
  WHERE name = 'Free - Teste'
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  new_user_type text;
  free_plan_id uuid;
BEGIN
  new_user_type := CASE
    WHEN NEW.email LIKE '%admin%' OR NEW.email = 'admin@bioflux.com' THEN 'admin'
    ELSE 'client'
  END;

  INSERT INTO public.profiles (id, first_name, last_name, email, whatsapp, user_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'whatsapp',
    new_user_type
  );

  IF new_user_type = 'client' THEN
    SELECT id
    INTO free_plan_id
    FROM public.subscription_plans
    WHERE name = 'Free - Teste'
    LIMIT 1;

    IF free_plan_id IS NOT NULL THEN
      INSERT INTO public.client_subscriptions (
        user_id,
        plan_id,
        service_type,
        status,
        forms_completed,
        responses_used,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        free_plan_id,
        'treino-dieta',
        'ativo',
        false,
        0,
        now(),
        now()
      )
      ON CONFLICT (user_id, plan_id, service_type) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DO $$
DECLARE
  free_plan_id uuid;
BEGIN
  SELECT id
  INTO free_plan_id
  FROM public.subscription_plans
  WHERE name = 'Free - Teste'
  LIMIT 1;

  IF free_plan_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.client_subscriptions (
    user_id,
    plan_id,
    service_type,
    status,
    forms_completed,
    responses_used,
    created_at,
    updated_at
  )
  SELECT
    profiles.id,
    free_plan_id,
    'treino-dieta',
    'ativo',
    false,
    0,
    now(),
    now()
  FROM public.profiles
  WHERE profiles.user_type = 'client'
    AND NOT EXISTS (
      SELECT 1
      FROM public.client_subscriptions
      WHERE client_subscriptions.user_id = profiles.id
    );
END $$;
