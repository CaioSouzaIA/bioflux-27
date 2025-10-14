-- Remover o badge genérico "Lealdade" se existir
DELETE FROM public.badges WHERE name = 'Lealdade';

-- Adicionar coluna de metadados aos badges (se não existir)
ALTER TABLE public.badges 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Inserir os 5 checkpoints de Lealdade com suas respectivas imagens e critérios
INSERT INTO public.badges (name, description, image_url, metadata)
VALUES 
  (
    'Lealdade - 1 Mês',
    'Complete 1 mês de jornada conosco',
    '/lovable-uploads/lealdade-1mes.png',
    '{"type": "account_age", "days_required": 30, "checkpoint": 1}'::jsonb
  ),
  (
    'Lealdade - 3 Meses',
    'Complete 3 meses de jornada conosco',
    '/lovable-uploads/lealdade-3meses.png',
    '{"type": "account_age", "days_required": 90, "checkpoint": 2}'::jsonb
  ),
  (
    'Lealdade - 6 Meses',
    'Complete 6 meses de jornada conosco',
    '/lovable-uploads/lealdade-6meses.png',
    '{"type": "account_age", "days_required": 180, "checkpoint": 3}'::jsonb
  ),
  (
    'Lealdade - 1 Ano',
    'Complete 1 ano de jornada conosco',
    '/lovable-uploads/lealdade-1ano.png',
    '{"type": "account_age", "days_required": 365, "checkpoint": 4}'::jsonb
  ),
  (
    'Lealdade - 3 Anos',
    'Complete 3 anos de jornada conosco',
    '/lovable-uploads/lealdade-3anos.png',
    '{"type": "account_age", "days_required": 1095, "checkpoint": 5}'::jsonb
  )
ON CONFLICT DO NOTHING;