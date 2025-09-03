-- Phase 1: Critical RLS Policy Implementation

-- 1. Add RLS policies for protocolos table
CREATE POLICY "Users can view their own protocols" 
ON public.protocolos 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()
));

CREATE POLICY "Admins can manage all protocols" 
ON public.protocolos 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- 2. Add RLS policies for documents table  
CREATE POLICY "Admins can manage all documents" 
ON public.documents 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- 3. Add RLS policies for n8n_chat_histories table
CREATE POLICY "Admins can manage chat histories" 
ON public.n8n_chat_histories 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- 4. Restrict public access to subscription_plans - keep public read but add authentication requirement
DROP POLICY IF EXISTS "Everyone can view subscription plans" ON public.subscription_plans;

CREATE POLICY "Authenticated users can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 5. Fix user_forms public access - remove overly permissive policies
DROP POLICY IF EXISTS "Allow public read access for shared forms" ON public.user_forms;
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os formulários" ON public.user_forms;

-- Add more restrictive policy for shared forms
CREATE POLICY "Public can view shared forms" 
ON public.user_forms 
FOR SELECT 
USING (auth.uid() IS NULL OR auth.uid() IS NOT NULL);

-- 6. Phase 2: Database Function Hardening - Add search_path security to functions
CREATE OR REPLACE FUNCTION public.change_client_plan_by_email(client_email text, new_plan_id uuid, is_unlimited boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    client_user_id uuid;
    plan_data record;
    service_type_value text := 'treino_dieta';
BEGIN
    -- Input validation
    IF client_email IS NULL OR trim(client_email) = '' THEN
        RAISE EXCEPTION 'Email do cliente é obrigatório';
    END IF;
    
    IF new_plan_id IS NULL THEN
        RAISE EXCEPTION 'ID do plano é obrigatório';
    END IF;
    
    -- Buscar o user_id pelo email
    SELECT id INTO client_user_id 
    FROM public.profiles 
    WHERE email = client_email
    LIMIT 1;
    
    IF client_user_id IS NULL THEN
        RAISE EXCEPTION 'Cliente com email % não encontrado', client_email;
    END IF;
    
    -- Buscar dados do plano
    SELECT * INTO plan_data
    FROM public.subscription_plans 
    WHERE id = new_plan_id
    LIMIT 1;
    
    IF plan_data IS NULL THEN
        RAISE EXCEPTION 'Plano não encontrado';
    END IF;
    
    -- Determinar service_type baseado no nome do plano
    IF plan_data.name ILIKE '%treino + dieta%' OR plan_data.name ILIKE '%ilimitado%' THEN
        service_type_value := 'treino_dieta';
    ELSIF plan_data.name ILIKE '%treino%' THEN
        service_type_value := 'treino';
    ELSIF plan_data.name ILIKE '%dieta%' THEN
        service_type_value := 'dieta';
    END IF;
    
    -- Cancelar assinaturas ativas atuais
    UPDATE public.client_subscriptions 
    SET status = 'cancelado',
        updated_at = now()
    WHERE user_id = client_user_id 
    AND status = 'ativo';
    
    -- Se for plano ilimitado
    IF is_unlimited THEN
        -- Habilitar plano ilimitado no perfil
        UPDATE public.profiles 
        SET unlimited_plan_enabled = true,
            updated_at = now()
        WHERE id = client_user_id;
        
        -- Criar assinatura ilimitada (12 meses)
        INSERT INTO public.client_subscriptions (
            user_id, 
            plan_id, 
            service_type, 
            status, 
            forms_completed,
            expires_at,
            created_at,
            updated_at
        ) VALUES (
            client_user_id, 
            new_plan_id, 
            service_type_value, 
            'ativo', 
            false,
            now() + INTERVAL '12 months',
            now(),
            now()
        );
    ELSE
        -- Desabilitar plano ilimitado se estiver habilitado
        UPDATE public.profiles 
        SET unlimited_plan_enabled = false,
            updated_at = now()
        WHERE id = client_user_id;
        
        -- Criar assinatura normal (30 dias)
        INSERT INTO public.client_subscriptions (
            user_id, 
            plan_id, 
            service_type, 
            status, 
            forms_completed,
            expires_at,
            created_at,
            updated_at
        ) VALUES (
            client_user_id, 
            new_plan_id, 
            service_type_value, 
            'ativo', 
            false,
            now() + INTERVAL '30 days',
            now(),
            now()
        );
    END IF;
    
    RETURN true;
END;
$function$;

-- Update toggle_unlimited_plan function with search_path security
CREATE OR REPLACE FUNCTION public.toggle_unlimited_plan(client_user_id uuid, enable_unlimited boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    unlimited_plan_id uuid;
BEGIN
    -- Input validation
    IF client_user_id IS NULL THEN
        RAISE EXCEPTION 'ID do cliente é obrigatório';
    END IF;
    
    -- Buscar o ID do plano ilimitado
    SELECT id INTO unlimited_plan_id 
    FROM public.subscription_plans 
    WHERE name = 'Plano Ilimitado' 
    LIMIT 1;
    
    IF unlimited_plan_id IS NULL THEN
        RAISE EXCEPTION 'Plano ilimitado não encontrado';
    END IF;
    
    -- Atualizar o perfil do usuário
    UPDATE public.profiles 
    SET unlimited_plan_enabled = enable_unlimited,
        updated_at = now()
    WHERE id = client_user_id;
    
    IF enable_unlimited THEN
        -- Cancelar assinaturas ativas atuais
        UPDATE public.client_subscriptions 
        SET status = 'cancelado',
            updated_at = now()
        WHERE user_id = client_user_id 
        AND status = 'ativo';
        
        -- Criar nova assinatura ilimitada
        INSERT INTO public.client_subscriptions (
            user_id, 
            plan_id, 
            service_type, 
            status, 
            forms_completed,
            expires_at
        ) VALUES (
            client_user_id, 
            unlimited_plan_id, 
            'treino_dieta', 
            'ativo', 
            false,
            now() + INTERVAL '12 months'
        );
    ELSE
        -- Se desabilitar, cancelar a assinatura ilimitada
        UPDATE public.client_subscriptions 
        SET status = 'cancelado',
            updated_at = now()
        WHERE user_id = client_user_id 
        AND plan_id = unlimited_plan_id
        AND status = 'ativo';
    END IF;
    
    RETURN FOUND;
END;
$function$;

-- Update reset_client_forms function with search_path security
CREATE OR REPLACE FUNCTION public.reset_client_forms(client_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Input validation
  IF client_user_id IS NULL THEN
    RAISE EXCEPTION 'ID do cliente é obrigatório';
  END IF;
  
  -- Resetar o status de formulários completados para o cliente
  UPDATE public.client_subscriptions 
  SET forms_completed = false,
      updated_at = now()
  WHERE user_id = client_user_id 
  AND status = 'ativo';
  
  RETURN FOUND;
END;
$function$;