-- Inserir badges Mestre do Ferro
INSERT INTO badges (name, description, image_url, metadata)
VALUES 
  ('Mestre do Ferro I', 'Complete 5 dias de treino em um mês', '/lovable-uploads/mestre-ferro-1.png', '{"type": "workout_checkins", "monthly_checkins_required": 5}'::jsonb),
  ('Mestre do Ferro II', 'Complete 10 dias de treino em um mês', '/lovable-uploads/mestre-ferro-2.png', '{"type": "workout_checkins", "monthly_checkins_required": 10}'::jsonb),
  ('Mestre do Ferro III', 'Complete 20 dias de treino em um mês', '/lovable-uploads/mestre-ferro-3.png', '{"type": "workout_checkins", "monthly_checkins_required": 20}'::jsonb),
  ('Mestre do Ferro IV', 'Complete 25 dias de treino em um mês', '/lovable-uploads/mestre-ferro-4.png', '{"type": "workout_checkins", "monthly_checkins_required": 25}'::jsonb),
  ('Mestre do Ferro V', 'Complete 30 dias de treino em um mês', '/lovable-uploads/mestre-ferro-5.png', '{"type": "workout_checkins", "monthly_checkins_required": 30}'::jsonb);