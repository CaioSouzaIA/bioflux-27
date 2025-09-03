-- Primeiro, vamos verificar se existe um plano ilimitado e criar se necessário
INSERT INTO public.subscription_plans (name, max_plans, price)
VALUES ('Plano Ilimitado', 999999, 0.00)
ON CONFLICT (name) DO NOTHING;

-- Criar função para alternar plano ilimitado
CREATE OR REPLACE FUNCTION public.toggle_unlimited_plan(client_user_id uuid, enable_unlimited boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unlimited_plan_id uuid;
BEGIN
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
$$;