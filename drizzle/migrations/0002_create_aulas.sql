CREATE TABLE public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  modalidade TEXT NOT NULL,
  horario TEXT NOT NULL,
  professor TEXT NOT NULL DEFAULT '',
  observacoes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.aula_presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aula_id, aluno_id)
);

CREATE INDEX idx_aulas_data ON public.aulas (data DESC);
CREATE INDEX idx_aula_presencas_aula ON public.aula_presencas (aula_id);
CREATE INDEX idx_aula_presencas_aluno ON public.aula_presencas (aluno_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aulas TO authenticated;
GRANT ALL ON public.aulas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aula_presencas TO authenticated;
GRANT ALL ON public.aula_presencas TO service_role;

ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aula_presencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff gerencia aulas" ON public.aulas FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Aluno ve aulas que participou" ON public.aulas FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.aula_presencas p
    WHERE p.aula_id = aulas.id AND private.is_meu_aluno(p.aluno_id)
  ));

CREATE POLICY "Staff gerencia presencas" ON public.aula_presencas FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Aluno ve suas presencas" ON public.aula_presencas FOR SELECT TO authenticated
  USING (private.is_meu_aluno(aluno_id));