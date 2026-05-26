-- Fase 0: campo informativo de cargo no perfil do usuário
-- Ex.: "Engenheiro Civil", "Gestor", "TI", "Engenheiro Orçamentista"
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo text;
