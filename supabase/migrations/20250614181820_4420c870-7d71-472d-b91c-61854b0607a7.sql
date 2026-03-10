
-- Criar tabela para armazenar avaliações metabólicas
CREATE TABLE public.metabolic_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  height INTEGER NOT NULL,
  biological_sex TEXT NOT NULL CHECK (biological_sex IN ('masculino', 'feminino')),
  waist_circumference DECIMAL(5,2) NOT NULL,
  activity_factor DECIMAL(4,3) NOT NULL,
  tmb INTEGER NOT NULL,
  get_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.metabolic_assessments ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias avaliações
CREATE POLICY "Users can view their own metabolic assessments" 
  ON public.metabolic_assessments 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para permitir que usuários criem suas próprias avaliações
CREATE POLICY "Users can create their own metabolic assessments" 
  ON public.metabolic_assessments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias avaliações
CREATE POLICY "Users can update their own metabolic assessments" 
  ON public.metabolic_assessments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para permitir que usuários deletem suas próprias avaliações
CREATE POLICY "Users can delete their own metabolic assessments" 
  ON public.metabolic_assessments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_metabolic_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_metabolic_assessments_updated_at
  BEFORE UPDATE ON public.metabolic_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_metabolic_assessments_updated_at();
