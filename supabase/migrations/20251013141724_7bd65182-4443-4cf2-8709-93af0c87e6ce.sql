-- Inserir as novas badges
INSERT INTO public.badges (name, description, image_url)
VALUES 
  ('Mestre do Ferro', 'Conquista dedicada aos que demonstram força e determinação no treinamento', '/lovable-uploads/badge-mestre-ferro.png'),
  ('Lealdade', 'Conquista especial para usuários comprometidos e fiéis à plataforma', '/lovable-uploads/badge-lealdade.png')
ON CONFLICT DO NOTHING;