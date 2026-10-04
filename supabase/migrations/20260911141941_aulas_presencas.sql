-- Copiado de drizzle/migrations/0002_create_aulas.sql (trilho do Lovable), na versão idempotente.
-- Precisa vir antes de 20261004000000, que altera public.aulas e cria reservas_aula.
CREATE TABLE IF NOT EXISTS public.aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  modalidade text NOT NULL,
  horario text NOT NULL,
  professor text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.aula_presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aula_id, aluno_id)
);

CREATE INDEX IF NOT EXISTS idx_aulas_data ON public.aulas (data DESC);
CREATE INDEX IF NOT EXISTS idx_aula_presencas_aula ON public.aula_presencas (aula_id);
CREATE INDEX IF NOT EXISTS idx_aula_presencas_aluno ON public.aula_presencas (aluno_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aulas TO authenticated;
GRANT ALL ON public.aulas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aula_presencas TO authenticated;
GRANT ALL ON public.aula_presencas TO service_role;

ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aula_presencas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff gerencia aulas" ON public.aulas;
CREATE POLICY "Staff gerencia aulas" ON public.aulas FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'staff'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'staff'::public.app_role));

DROP POLICY IF EXISTS "Aluno ve aulas que participou" ON public.aulas;
CREATE POLICY "Aluno ve aulas que participou" ON public.aulas FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.aula_presencas p
    WHERE p.aula_id = aulas.id AND private.is_meu_aluno(p.aluno_id)
  ));

DROP POLICY IF EXISTS "Staff gerencia presencas" ON public.aula_presencas;
CREATE POLICY "Staff gerencia presencas" ON public.aula_presencas FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'staff'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'staff'::public.app_role));

DROP POLICY IF EXISTS "Aluno ve suas presencas" ON public.aula_presencas;
CREATE POLICY "Aluno ve suas presencas" ON public.aula_presencas FOR SELECT TO authenticated
  USING (private.is_meu_aluno(aluno_id));
