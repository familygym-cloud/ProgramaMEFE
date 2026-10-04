-- Copiado de drizzle/migrations/0000_add_turno_termo_alunos.sql (trilho do Lovable), na versão
-- idempotente: o banco do Lovable já aplicou o original, e aqui o esquema fica completo para quem
-- cria o banco só com `supabase db push` / `supabase db reset`.
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS turno text NOT NULL DEFAULT 'Manhã';

DO $$
BEGIN
  -- A carga inicial do termo roda uma única vez, na criação da coluna: reexecutar não pode
  -- preencher de novo termos que a equipe deixou em branco de propósito.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'alunos' AND column_name = 'termo_valido_ate'
  ) THEN
    ALTER TABLE public.alunos ADD COLUMN termo_valido_ate date;
    UPDATE public.alunos
    SET termo_valido_ate = (matricula + INTERVAL '12 months')::date
    WHERE termo_valido_ate IS NULL;
  END IF;
END $$;
