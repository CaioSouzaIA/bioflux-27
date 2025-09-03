
-- Replica as políticas de segurança da tabela 'diet_prescriptions' para a 'training_prescriptions'
-- para garantir consistência, incluindo políticas que podem ser redundantes.

-- Permite que admins insiram prescrições de treino (redundante com a política 'ALL').
CREATE POLICY "Admins can insert training prescriptions"
  ON public.training_prescriptions
  FOR INSERT
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Permite que admins atualizem prescrições de treino (redundante com a política 'ALL').
CREATE POLICY "Admins can update training prescriptions"
  ON public.training_prescriptions
  FOR UPDATE
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Permite que admins vejam todas as prescrições de treino (redundante com a política 'ALL').
CREATE POLICY "Admins can view all training prescriptions"
  ON public.training_prescriptions
  FOR SELECT
  USING (public.get_current_user_role() = 'admin');

-- Adiciona uma política de visualização para usuários em inglês, para espelhar 'diet_prescriptions'.
CREATE POLICY "Users can view their own training prescriptions"
  ON public.training_prescriptions
  FOR SELECT
  USING (auth.uid() = user_id);
