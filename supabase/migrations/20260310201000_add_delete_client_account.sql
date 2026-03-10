CREATE OR REPLACE FUNCTION public.delete_client_account(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth, storage, pg_catalog
AS $function$
DECLARE
  requester_role text;
  target_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'ID do cliente é obrigatório';
  END IF;

  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Não é permitido excluir a própria conta';
  END IF;

  SELECT user_type
  INTO requester_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF requester_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir clientes';
  END IF;

  SELECT user_type
  INTO target_role
  FROM public.profiles
  WHERE id = target_user_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Cliente não encontrado';
  END IF;

  IF target_role IS DISTINCT FROM 'client' THEN
    RAISE EXCEPTION 'A exclusão está disponível apenas para clientes';
  END IF;

  DELETE FROM public.training_periodization WHERE user_id = target_user_id;
  DELETE FROM public.training_prescriptions WHERE user_id = target_user_id;
  DELETE FROM public.diet_prescriptions WHERE user_id = target_user_id;
  DELETE FROM public.metabolic_assessments WHERE user_id = target_user_id;
  DELETE FROM public.form_responses WHERE user_id = target_user_id;
  DELETE FROM public.user_forms WHERE user_id = target_user_id;
  DELETE FROM public.user_types WHERE user_id = target_user_id;
  DELETE FROM public.client_subscriptions WHERE user_id = target_user_id;
  DELETE FROM public.user_achievements WHERE user_id = target_user_id;
  DELETE FROM public.workout_checkins WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN TRUE;
END;
$function$;
