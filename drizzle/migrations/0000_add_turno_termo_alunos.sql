ALTER TABLE public.alunos
  ADD COLUMN turno TEXT NOT NULL DEFAULT 'Manhã',
  ADD COLUMN termo_valido_ate DATE;

UPDATE public.alunos SET termo_valido_ate = matricula + INTERVAL '12 months' WHERE termo_valido_ate IS NULL;