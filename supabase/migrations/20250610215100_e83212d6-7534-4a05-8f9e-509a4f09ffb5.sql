
-- Criar bucket para armazenar os PDFs das dietas
INSERT INTO storage.buckets (id, name, public)
VALUES ('diet-pdfs', 'diet-pdfs', true);

-- Criar políticas de segurança para o bucket diet-pdfs
-- Política para permitir que usuários vejam apenas seus próprios PDFs
CREATE POLICY "Users can view their own diet PDFs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'diet-pdfs' AND 
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- Política para permitir que admins insiram PDFs para qualquer usuário
CREATE POLICY "Admins can insert diet PDFs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'diet-pdfs' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Política para permitir que admins atualizem PDFs
CREATE POLICY "Admins can update diet PDFs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'diet-pdfs' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Política para permitir que admins deletem PDFs
CREATE POLICY "Admins can delete diet PDFs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'diet-pdfs' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Criar tabela para registrar os PDFs de dieta gerados
CREATE TABLE IF NOT EXISTS public.diet_prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  form_response_id UUID,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

-- Adicionar RLS para a tabela diet_prescriptions
ALTER TABLE public.diet_prescriptions ENABLE ROW LEVEL SECURITY;

-- Política para que clientes vejam apenas suas próprias prescrições
CREATE POLICY "Users can view their own diet prescriptions" ON public.diet_prescriptions
FOR SELECT USING (auth.uid() = user_id);

-- Política para que admins vejam todas as prescrições
CREATE POLICY "Admins can view all diet prescriptions" ON public.diet_prescriptions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Política para que admins insiram prescrições
CREATE POLICY "Admins can insert diet prescriptions" ON public.diet_prescriptions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Política para que admins atualizem prescrições
CREATE POLICY "Admins can update diet prescriptions" ON public.diet_prescriptions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Adicionar foreign key constraint para form_responses (opcional)
ALTER TABLE public.diet_prescriptions 
ADD CONSTRAINT fk_diet_prescriptions_form_response 
FOREIGN KEY (form_response_id) REFERENCES public.form_responses(id) ON DELETE SET NULL;

-- Criar índices para melhor performance
CREATE INDEX idx_diet_prescriptions_user_id ON public.diet_prescriptions(user_id);
CREATE INDEX idx_diet_prescriptions_status ON public.diet_prescriptions(status);
CREATE INDEX idx_diet_prescriptions_created_at ON public.diet_prescriptions(created_at);
