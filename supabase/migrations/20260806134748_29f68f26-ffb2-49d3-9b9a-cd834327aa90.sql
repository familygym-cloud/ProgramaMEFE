CREATE TABLE public.assinaturas_relatorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  assinante text NOT NULL,
  referencia text NOT NULL DEFAULT '',
  assinado_em timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.assinaturas_relatorio TO anon;
GRANT SELECT, INSERT ON public.assinaturas_relatorio TO authenticated;
GRANT ALL ON public.assinaturas_relatorio TO service_role;

ALTER TABLE public.assinaturas_relatorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assinaturas visiveis publicamente"
  ON public.assinaturas_relatorio FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Qualquer um pode registrar assinatura"
  ON public.assinaturas_relatorio FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX assinaturas_relatorio_aluno_id_idx ON public.assinaturas_relatorio(aluno_id);