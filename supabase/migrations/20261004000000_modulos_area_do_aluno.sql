-- Módulos da área do aluno: treinos, reservas de aula, metas, medidas corporais
-- e atualização segura dos dados de contato pelo próprio aluno.
-- Todas as tabelas seguem o padrão do projeto: o aluno enxerga só o que é dele
-- (private.is_meu_aluno) e a equipe (role 'staff') gerencia tudo.

-- 1) Treinos prescritos pela equipe ------------------------------------------------
CREATE TABLE public.treinos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  foco text NOT NULL DEFAULT '',
  nivel text NOT NULL DEFAULT 'Iniciante' CHECK (nivel IN ('Iniciante', 'Intermediário', 'Avançado')),
  -- 0 = domingo ... 6 = sábado; NULL = livre (sem dia fixo)
  dia_semana smallint CHECK (dia_semana BETWEEN 0 AND 6),
  observacoes text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.treino_exercicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id uuid NOT NULL REFERENCES public.treinos(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  nome text NOT NULL,
  grupo_muscular text NOT NULL DEFAULT '',
  series integer NOT NULL DEFAULT 3 CHECK (series > 0),
  repeticoes text NOT NULL DEFAULT '12',
  carga_kg numeric(6, 2),
  descanso_seg integer NOT NULL DEFAULT 60 CHECK (descanso_seg >= 0),
  observacoes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX treinos_aluno_id_idx ON public.treinos(aluno_id);
CREATE INDEX treino_exercicios_treino_id_idx ON public.treino_exercicios(treino_id, ordem);

-- 2) Reservas de aulas coletivas -----------------------------------------------------
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS vagas integer NOT NULL DEFAULT 20 CHECK (vagas > 0);

CREATE TABLE public.reservas_aula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'reservada' CHECK (status IN ('reservada', 'cancelada')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (aula_id, aluno_id)
);

CREATE INDEX reservas_aula_aluno_id_idx ON public.reservas_aula(aluno_id);
CREATE INDEX reservas_aula_aula_id_idx ON public.reservas_aula(aula_id);

-- 3) Metas do aluno ---------------------------------------------------------------------
CREATE TABLE public.metas_aluno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('peso', 'frequencia', 'imc')),
  alvo numeric(7, 2) NOT NULL,
  prazo date,
  concluida boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX metas_aluno_aluno_id_idx ON public.metas_aluno(aluno_id);

-- 4) Medidas corporais (avaliação física completa) ------------------------------------
CREATE TABLE public.medidas_corporais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT current_date,
  gordura_pct numeric(4, 1) CHECK (gordura_pct BETWEEN 2 AND 70),
  massa_magra_kg numeric(5, 1),
  cintura_cm numeric(5, 1),
  quadril_cm numeric(5, 1),
  peito_cm numeric(5, 1),
  braco_cm numeric(5, 1),
  coxa_cm numeric(5, 1),
  observacoes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX medidas_corporais_aluno_data_idx ON public.medidas_corporais(aluno_id, data);

-- 5) Permissões e RLS ----------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treinos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treino_exercicios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservas_aula TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_aluno TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medidas_corporais TO authenticated;
GRANT ALL ON public.treinos, public.treino_exercicios, public.reservas_aula,
  public.metas_aluno, public.medidas_corporais TO service_role;

ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas_aula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medidas_corporais ENABLE ROW LEVEL SECURITY;

-- Treinos: aluno só lê; equipe prescreve.
CREATE POLICY "Aluno ve seus treinos" ON public.treinos FOR SELECT TO authenticated
USING (private.is_meu_aluno(aluno_id));
CREATE POLICY "Staff gerencia treinos" ON public.treinos FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

CREATE POLICY "Aluno ve exercicios dos seus treinos" ON public.treino_exercicios FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.treinos t
  WHERE t.id = treino_id AND private.is_meu_aluno(t.aluno_id)
));
CREATE POLICY "Staff gerencia exercicios" ON public.treino_exercicios FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

-- Reservas: o aluno reserva e cancela apenas as próprias.
CREATE POLICY "Aluno ve suas reservas" ON public.reservas_aula FOR SELECT TO authenticated
USING (private.is_meu_aluno(aluno_id));
CREATE POLICY "Aluno reserva para si" ON public.reservas_aula FOR INSERT TO authenticated
WITH CHECK (private.is_meu_aluno(aluno_id) AND status = 'reservada');
CREATE POLICY "Aluno cancela sua reserva" ON public.reservas_aula FOR UPDATE TO authenticated
USING (private.is_meu_aluno(aluno_id)) WITH CHECK (private.is_meu_aluno(aluno_id));
CREATE POLICY "Staff gerencia reservas" ON public.reservas_aula FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

-- Metas: o aluno gerencia as próprias; a equipe também.
CREATE POLICY "Aluno gerencia suas metas" ON public.metas_aluno FOR ALL TO authenticated
USING (private.is_meu_aluno(aluno_id)) WITH CHECK (private.is_meu_aluno(aluno_id));
CREATE POLICY "Staff gerencia metas" ON public.metas_aluno FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

-- Medidas: aluno só lê; equipe registra na avaliação.
CREATE POLICY "Aluno ve suas medidas" ON public.medidas_corporais FOR SELECT TO authenticated
USING (private.is_meu_aluno(aluno_id));
CREATE POLICY "Staff gerencia medidas" ON public.medidas_corporais FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

-- Contagem de vagas ocupadas sem expor reservas de outros alunos.
CREATE OR REPLACE FUNCTION public.vagas_ocupadas(_aula_ids uuid[])
RETURNS TABLE (aula_id uuid, ocupadas bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.aula_id, count(*) FROM public.reservas_aula r
  WHERE r.aula_id = ANY (_aula_ids) AND r.status = 'reservada'
  GROUP BY r.aula_id
$$;
REVOKE ALL ON FUNCTION public.vagas_ocupadas(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vagas_ocupadas(uuid[]) TO authenticated;

-- O aluno altera só telefone e e-mail de contato do próprio cadastro
-- (a política de UPDATE em alunos continua restrita à equipe).
CREATE OR REPLACE FUNCTION public.atualizar_meu_contato(_telefone text, _email text)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.alunos
  SET telefone = NULLIF(trim(_telefone), ''),
      email = NULLIF(trim(_email), ''),
      updated_at = now()
  WHERE user_id = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.atualizar_meu_contato(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atualizar_meu_contato(text, text) TO authenticated;

-- A agenda futura de aulas (modalidade, professor, horário) é visível a qualquer aluno
-- autenticado, para permitir a reserva. Aulas passadas continuam restritas a quem participou.
CREATE POLICY "Aluno ve agenda futura de aulas" ON public.aulas FOR SELECT TO authenticated
USING (data >= current_date);
