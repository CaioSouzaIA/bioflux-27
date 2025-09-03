
-- Habilitar a extensão http para fazer requisições HTTP
CREATE EXTENSION IF NOT EXISTS http;

-- Função para enviar dados para o webhook
CREATE OR REPLACE FUNCTION public.send_webhook_notification(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_whatsapp TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT := 'https://webhook.n8n1.agenciaevodigital.com/webhook/saudacao';
  payload JSON;
  response http_response;
BEGIN
  -- Criar o payload JSON
  payload := json_build_object(
    'nome', p_first_name,
    'sobrenome', p_last_name,
    'email', p_email,
    'whatsapp', p_whatsapp
  );

  -- Enviar requisição POST para o webhook
  BEGIN
    SELECT * INTO response FROM http((
      'POST',
      webhook_url,
      ARRAY[http_header('Content-Type', 'application/json')],
      'application/json',
      payload::text
    )::http_request);
    
    -- Log do resultado (opcional)
    RAISE NOTICE 'Webhook enviado com sucesso. Status: %', response.status;
    
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar, apenas logamos o erro mas não interrompemos o processo de cadastro
    RAISE NOTICE 'Erro ao enviar webhook: %', SQLERRM;
  END;
END;
$$;

-- Atualizar a função handle_new_user para incluir o envio do webhook
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_first_name TEXT;
  user_last_name TEXT;
  user_email TEXT;
  user_whatsapp TEXT;
BEGIN
  -- Extrair dados do usuário
  user_first_name := NEW.raw_user_meta_data ->> 'first_name';
  user_last_name := NEW.raw_user_meta_data ->> 'last_name';
  user_email := NEW.email;
  user_whatsapp := NEW.raw_user_meta_data ->> 'whatsapp';

  -- Inserir perfil na tabela profiles
  INSERT INTO public.profiles (id, first_name, last_name, email, whatsapp, user_type)
  VALUES (
    NEW.id,
    user_first_name,
    user_last_name,
    user_email,
    user_whatsapp,
    CASE 
      WHEN NEW.email LIKE '%admin%' OR NEW.email = 'admin@bioflux.com' THEN 'admin'
      ELSE 'client'
    END
  );

  -- Enviar webhook apenas para clientes (não para admins)
  IF NOT (NEW.email LIKE '%admin%' OR NEW.email = 'admin@bioflux.com') THEN
    PERFORM public.send_webhook_notification(
      user_first_name,
      user_last_name,
      user_email,
      user_whatsapp
    );
  END IF;

  RETURN NEW;
END;
$$;
