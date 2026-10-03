CREATE TABLE public.pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  referencia text NOT NULL,
  valor numeric NOT NULL,
  parcela integer NOT NULL DEFAULT 1,
  total_parcelas integer NOT NULL DEFAULT 1,
  vencimento date NOT NULL,
  status text NOT NULL DEFAULT 'Pendente',
  pago_em date,
  metodo text NOT NULL DEFAULT 'Pix',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO authenticated;
GRANT ALL ON public.pagamentos TO service_role;

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aluno ve seus pagamentos" ON public.pagamentos
  FOR SELECT TO authenticated
  USING (private.is_meu_aluno(aluno_id));

CREATE POLICY "Staff gerencia pagamentos" ON public.pagamentos
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'staff'::app_role));

CREATE INDEX pagamentos_aluno_idx ON public.pagamentos (aluno_id, vencimento);
