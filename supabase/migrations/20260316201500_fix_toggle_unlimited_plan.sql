CREATE OR REPLACE FUNCTION public.toggle_unlimited_plan(client_user_id uuid, enable_unlimited boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    unlimited_plan_id uuid;
    existing_unlimited_subscription_id uuid;
BEGIN
    IF client_user_id IS NULL THEN
        RAISE EXCEPTION 'ID do cliente e obrigatorio';
    END IF;

    SELECT id
    INTO unlimited_plan_id
    FROM public.subscription_plans
    WHERE name = 'Plano Ilimitado'
    LIMIT 1;

    IF unlimited_plan_id IS NULL THEN
        RAISE EXCEPTION 'Plano ilimitado nao encontrado';
    END IF;

    UPDATE public.client_subscriptions
    SET service_type = 'treino-dieta',
        updated_at = now()
    WHERE plan_id = unlimited_plan_id
      AND service_type = 'treino_dieta';

    UPDATE public.profiles
    SET unlimited_plan_enabled = enable_unlimited,
        activated = CASE WHEN enable_unlimited THEN true ELSE false END,
        updated_at = now()
    WHERE id = client_user_id;

    IF enable_unlimited THEN
        UPDATE public.client_subscriptions
        SET status = 'cancelado',
            updated_at = now()
        WHERE user_id = client_user_id
          AND status = 'ativo'
          AND plan_id <> unlimited_plan_id;

        SELECT id
        INTO existing_unlimited_subscription_id
        FROM public.client_subscriptions
        WHERE user_id = client_user_id
          AND plan_id = unlimited_plan_id
          AND service_type = 'treino-dieta'
        ORDER BY created_at DESC
        LIMIT 1;

        IF existing_unlimited_subscription_id IS NOT NULL THEN
            UPDATE public.client_subscriptions
            SET status = 'ativo',
                forms_completed = false,
                responses_used = 0,
                expires_at = now() + INTERVAL '12 months',
                last_reset_date = now(),
                updated_at = now()
            WHERE id = existing_unlimited_subscription_id;
        ELSE
            INSERT INTO public.client_subscriptions (
                user_id,
                plan_id,
                service_type,
                status,
                forms_completed,
                responses_used,
                expires_at,
                last_reset_date,
                created_at,
                updated_at
            ) VALUES (
                client_user_id,
                unlimited_plan_id,
                'treino-dieta',
                'ativo',
                false,
                0,
                now() + INTERVAL '12 months',
                now(),
                now(),
                now()
            );
        END IF;
    ELSE
        UPDATE public.client_subscriptions
        SET status = 'cancelado',
            updated_at = now()
        WHERE user_id = client_user_id
          AND plan_id = unlimited_plan_id
          AND status = 'ativo';
    END IF;

    RETURN true;
END;
$function$;
