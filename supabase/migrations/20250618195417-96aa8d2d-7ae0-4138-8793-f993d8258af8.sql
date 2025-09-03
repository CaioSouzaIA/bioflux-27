
-- Criar tabela para periodização de treino
CREATE TABLE public.training_periodization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  training_prescription_id UUID,
  current_objective TEXT NOT NULL,
  training_volume TEXT NOT NULL,
  intensity TEXT NOT NULL,
  methods TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active'
);

-- Adicionar índices para performance
CREATE INDEX idx_training_periodization_user_id ON public.training_periodization(user_id);
CREATE INDEX idx_training_periodization_status ON public.training_periodization(status);

-- Habilitar RLS
ALTER TABLE public.training_periodization ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - usuários podem ver apenas suas próprias periodizações
CREATE POLICY "Users can view their own training periodization" 
  ON public.training_periodization 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training periodization" 
  ON public.training_periodization 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training periodization" 
  ON public.training_periodization 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training periodization" 
  ON public.training_periodization 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_training_periodization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_periodization_updated_at
  BEFORE UPDATE ON public.training_periodization
  FOR EACH ROW
  EXECUTE FUNCTION update_training_periodization_updated_at();
