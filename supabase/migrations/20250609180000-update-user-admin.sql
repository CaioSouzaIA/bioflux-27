
-- Atualizar usuário específico para ser admin
UPDATE public.profiles 
SET user_type = 'admin' 
WHERE id = '7f98101e-d543-4ace-b477-b10fd3eb6a72';
