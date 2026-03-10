
-- Adiciona uma política de segurança que permite a usuários com a função 'admin'
-- visualizar todos os registros na tabela 'client_subscriptions'.
-- A função get_current_user_role() já existe e retorna o tipo de usuário (admin ou client).
CREATE POLICY "Admins can view all client subscriptions"
ON public.client_subscriptions
FOR SELECT
TO authenticated
USING (public.get_current_user_role() = 'admin');
