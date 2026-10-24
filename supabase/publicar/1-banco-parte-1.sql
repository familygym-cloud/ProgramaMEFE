-- PARTE 1 de 2: esquema do banco até a criação dos perfis da equipe
-- Gerado por supabase/publicar/gerar.sh a partir de supabase/migrations. Cole TODO o conteúdo no SQL Editor e clique em Run.


-- ===== 20260805160135_62d087a5-877f-48a7-9780-e92b98ef8ce9.sql =====
CREATE TABLE public.alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  plano text NOT NULL,
  status text NOT NULL DEFAULT 'Ativo',
  idade integer NOT NULL,
  altura integer NOT NULL,
  peso numeric(5,1) NOT NULL,
  imc numeric(4,1) NOT NULL,
  frequencia integer NOT NULL DEFAULT 0,
  progresso integer NOT NULL DEFAULT 0,
  objetivo text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  email text,
  telefone text,
  matricula date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  mes text NOT NULL,
  referencia date NOT NULL,
  peso numeric(5,1) NOT NULL,
  imc numeric(4,1) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX avaliacoes_aluno_idx ON public.avaliacoes (aluno_id, referencia);

CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  data date NOT NULL,
  atividade text NOT NULL,
  duracao_min integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX check_ins_aluno_idx ON public.check_ins (aluno_id, data DESC);

GRANT SELECT ON public.alunos TO anon, authenticated;
GRANT SELECT ON public.avaliacoes TO anon, authenticated;
GRANT SELECT ON public.check_ins TO anon, authenticated;
GRANT ALL ON public.alunos TO service_role;
GRANT ALL ON public.avaliacoes TO service_role;
GRANT ALL ON public.check_ins TO service_role;

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alunos visiveis publicamente" ON public.alunos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Avaliacoes visiveis publicamente" ON public.avaliacoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Check-ins visiveis publicamente" ON public.check_ins FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.alunos (nome, plano, status, idade, altura, peso, imc, frequencia, progresso, objetivo, observacoes, email, telefone, matricula) VALUES
('Ana Ribeiro','Família','Ativo',34,168,63.2,22.4,18,86,'Manter condicionamento e melhorar resistência cardiovascular.','Excelente adesão aos treinos funcionais. Última avaliação mostrou queda de 1,2% de gordura corporal.','ana.ribeiro@email.com','(11) 98765-4321','2024-03-15'),
('Carlos Menezes','Individual','Ativo',42,178,88.2,27.8,14,64,'Reduzir percentual de gordura e fortalecer a coluna lombar.','Trabalhando carga progressiva na musculação. Evitar impacto inicial até liberação médica.','carlos.menezes@email.com','(11) 91234-5678','2023-08-10'),
('Família Duarte (4)','Família','Ativo',38,172,71.3,24.1,22,91,'Treinar em família e incentivar hábitos saudáveis nos filhos.','Titular da matrícula familiar. Alta frequência nos finais de semana.','duarte.familia@email.com','(11) 99876-5432','2025-01-08'),
('Beatriz Lima','Kids','Risco',10,142,38.7,19.2,9,42,'Desenvolver coordenação motora e introduzir atividade física regular.','Pais relatam dificuldade de constância. Acompanhamento pediátrico em dia.','bia.lima@email.com','(11) 93456-7890','2025-06-12'),
('Joaquim Alves','Sênior','Ativo',67,174,79.6,26.3,12,70,'Preservar mobilidade, equilíbrio e qualidade de vida.','Participa ativamente das aulas de hidroginástica. Pressão arterial controlada.','joaquim.alves@email.com','(11) 94567-8901','2022-11-03'),
('Marina Souza','Individual','Risco',29,165,80.5,29.6,4,28,'Retomar rotina de treinos e reduzir ansiedade relacionada à balança.','Baixa adesão. Agendada reavaliação com nutricionista para próxima semana.','marina.souza@email.com','(11) 95678-9012','2025-09-20'),
('Pedro Nogueira','Família','Inativo',51,181,102.2,31.2,0,11,'Reingressar na academia e iniciar acompanhamento multidisciplinar.','Sem frequência nos últimos 60 dias. Contato de reativação enviado.','pedro.nogueira@email.com','(11) 96789-0123','2024-02-14'),
('Luísa Campos','Individual','Ativo',26,170,62.8,21.7,16,79,'Ganhar massa muscular e melhorar desempenho nos treinos de força.','Progresso consistente na musculação. Aumento de carga de 15% no último bimestre.','luisa.campos@email.com','(11) 97890-1234','2023-05-22');

INSERT INTO public.avaliacoes (aluno_id, mes, referencia, peso, imc)
SELECT a.id, v.mes, v.referencia, v.peso, v.imc
FROM public.alunos a
JOIN (VALUES
('Ana Ribeiro','Jan','2026-01-01'::date,65.8,23.3),('Ana Ribeiro','Mar','2026-03-01',64.9,23.0),('Ana Ribeiro','Mai','2026-05-01',64.2,22.7),('Ana Ribeiro','Jul','2026-07-01',63.2,22.4),
('Carlos Menezes','Jan','2026-01-01',91.5,28.9),('Carlos Menezes','Mar','2026-03-01',90.1,28.4),('Carlos Menezes','Mai','2026-05-01',89.2,28.1),('Carlos Menezes','Jul','2026-07-01',88.2,27.8),
('Família Duarte (4)','Jan','2026-01-01',73.5,24.9),('Família Duarte (4)','Mar','2026-03-01',72.8,24.6),('Família Duarte (4)','Mai','2026-05-01',72.0,24.3),('Família Duarte (4)','Jul','2026-07-01',71.3,24.1),
('Beatriz Lima','Jan','2026-01-01',37.5,18.6),('Beatriz Lima','Mar','2026-03-01',38.1,18.9),('Beatriz Lima','Mai','2026-05-01',38.5,19.1),('Beatriz Lima','Jul','2026-07-01',38.7,19.2),
('Joaquim Alves','Jan','2026-01-01',81.4,26.9),('Joaquim Alves','Mar','2026-03-01',80.5,26.6),('Joaquim Alves','Mai','2026-05-01',80.0,26.4),('Joaquim Alves','Jul','2026-07-01',79.6,26.3),
('Marina Souza','Jan','2026-01-01',78.9,29.0),('Marina Souza','Mar','2026-03-01',79.6,29.2),('Marina Souza','Mai','2026-05-01',80.2,29.5),('Marina Souza','Jul','2026-07-01',80.5,29.6),
('Pedro Nogueira','Jan','2026-01-01',99.0,30.2),('Pedro Nogueira','Mar','2026-03-01',100.5,30.7),('Pedro Nogueira','Mai','2026-05-01',101.4,31.0),('Pedro Nogueira','Jul','2026-07-01',102.2,31.2),
('Luísa Campos','Jan','2026-01-01',61.0,21.1),('Luísa Campos','Mar','2026-03-01',61.5,21.3),('Luísa Campos','Mai','2026-05-01',62.2,21.5),('Luísa Campos','Jul','2026-07-01',62.8,21.7)
) AS v(nome, mes, referencia, peso, imc) ON v.nome = a.nome;

INSERT INTO public.check_ins (aluno_id, data, atividade, duracao_min)
SELECT a.id, c.data, c.atividade, c.duracao_min
FROM public.alunos a
JOIN (VALUES
('Ana Ribeiro','2026-07-28'::date,'Funcional',55),('Ana Ribeiro','2026-07-26','Yoga',50),('Ana Ribeiro','2026-07-24','Musculação',65),
('Carlos Menezes','2026-07-29','Musculação',70),('Carlos Menezes','2026-07-27','Pilates',60),('Carlos Menezes','2026-07-24','Musculação',65),
('Família Duarte (4)','2026-07-30','Natação',45),('Família Duarte (4)','2026-07-28','Funcional',55),('Família Duarte (4)','2026-07-25','Musculação',60),
('Beatriz Lima','2026-07-22','Dança',40),('Beatriz Lima','2026-07-15','Natação',35),('Beatriz Lima','2026-07-08','Dança',40),
('Joaquim Alves','2026-07-29','Hidroginástica',50),('Joaquim Alves','2026-07-27','Yoga',45),('Joaquim Alves','2026-07-24','Hidroginástica',50),
('Marina Souza','2026-07-20','Musculação',40),('Marina Souza','2026-07-13','Funcional',45),('Marina Souza','2026-07-06','Yoga',50),
('Luísa Campos','2026-07-30','Musculação',75),('Luísa Campos','2026-07-28','Funcional',50),('Luísa Campos','2026-07-26','Musculação',70)
) AS c(nome, data, atividade, duracao_min) ON c.nome = a.nome;

-- ===== 20260806134748_29f68f26-ffb2-49d3-9b9a-cd834327aa90.sql =====
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

-- ===== 20260807170303_118dd890-6459-441f-a15e-12e572fa2b10.sql =====
-- alunos
DROP POLICY IF EXISTS "Alunos visiveis publicamente" ON public.alunos;
CREATE POLICY "Alunos visiveis para autenticados"
  ON public.alunos FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.alunos FROM anon;
GRANT SELECT ON public.alunos TO authenticated;
GRANT ALL ON public.alunos TO service_role;

-- avaliacoes
DROP POLICY IF EXISTS "Avaliacoes visiveis publicamente" ON public.avaliacoes;
CREATE POLICY "Avaliacoes visiveis para autenticados"
  ON public.avaliacoes FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.avaliacoes FROM anon;
GRANT SELECT ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;

-- check_ins
DROP POLICY IF EXISTS "Check-ins visiveis publicamente" ON public.check_ins;
CREATE POLICY "Check-ins visiveis para autenticados"
  ON public.check_ins FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.check_ins FROM anon;
GRANT SELECT ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;

-- assinaturas_relatorio
DROP POLICY IF EXISTS "Assinaturas visiveis publicamente" ON public.assinaturas_relatorio;
DROP POLICY IF EXISTS "Qualquer um pode registrar assinatura" ON public.assinaturas_relatorio;
CREATE POLICY "Assinaturas visiveis para autenticados"
  ON public.assinaturas_relatorio FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem registrar assinatura"
  ON public.assinaturas_relatorio FOR INSERT TO authenticated WITH CHECK (true);
REVOKE ALL ON public.assinaturas_relatorio FROM anon;
GRANT SELECT, INSERT ON public.assinaturas_relatorio TO authenticated;
GRANT ALL ON public.assinaturas_relatorio TO service_role;

-- ===== 20260808115608_416ffe16-c1f0-4fa6-ae93-7f83e38ee40e.sql =====
-- 1. Roles enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('staff', 'aluno');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Usuarios veem seus proprios papeis"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff gerencia papeis"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));

-- 4. Link alunos to auth accounts
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS alunos_user_id_key ON public.alunos (user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_meu_aluno(_aluno_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.alunos
    WHERE id = _aluno_id AND user_id = auth.uid()
  )
$$;

-- 5. Replace blanket authenticated policies
DROP POLICY IF EXISTS "Alunos visiveis para autenticados" ON public.alunos;
DROP POLICY IF EXISTS "Avaliacoes visiveis para autenticados" ON public.avaliacoes;
DROP POLICY IF EXISTS "Check-ins visiveis para autenticados" ON public.check_ins;
DROP POLICY IF EXISTS "Assinaturas visiveis para autenticados" ON public.assinaturas_relatorio;
DROP POLICY IF EXISTS "Autenticados podem registrar assinatura" ON public.assinaturas_relatorio;

-- alunos
CREATE POLICY "Staff gerencia alunos" ON public.alunos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Aluno ve sua ficha" ON public.alunos FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- avaliacoes
CREATE POLICY "Staff gerencia avaliacoes" ON public.avaliacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Aluno ve suas avaliacoes" ON public.avaliacoes FOR SELECT TO authenticated
  USING (public.is_meu_aluno(aluno_id));

-- check_ins
CREATE POLICY "Staff gerencia check-ins" ON public.check_ins FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Aluno ve seus check-ins" ON public.check_ins FOR SELECT TO authenticated
  USING (public.is_meu_aluno(aluno_id));
CREATE POLICY "Aluno registra seu check-in" ON public.check_ins FOR INSERT TO authenticated
  WITH CHECK (public.is_meu_aluno(aluno_id));

-- assinaturas_relatorio
CREATE POLICY "Staff gerencia assinaturas" ON public.assinaturas_relatorio FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Aluno ve suas assinaturas" ON public.assinaturas_relatorio FOR SELECT TO authenticated
  USING (public.is_meu_aluno(aluno_id));
CREATE POLICY "Aluno assina seu relatorio" ON public.assinaturas_relatorio FOR INSERT TO authenticated
  WITH CHECK (public.is_meu_aluno(aluno_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alunos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_ins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assinaturas_relatorio TO authenticated;
GRANT ALL ON public.alunos TO service_role;
GRANT ALL ON public.avaliacoes TO service_role;
GRANT ALL ON public.check_ins TO service_role;
GRANT ALL ON public.assinaturas_relatorio TO service_role;

-- ===== 20260808115635_eba7bc34-aaad-495c-8adc-c476c3aa728a.sql =====
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_meu_aluno(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_meu_aluno(uuid) TO authenticated, service_role;

-- ===== 20260811172706_7035a6a7-f883-4624-ab4d-e1d6136addf8.sql =====
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION private.is_meu_aluno(_aluno_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.alunos WHERE id = _aluno_id AND user_id = auth.uid()) $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_meu_aluno(uuid) FROM PUBLIC, anon, authenticated;

DROP POLICY "Staff gerencia alunos" ON public.alunos;
CREATE POLICY "Staff gerencia alunos" ON public.alunos FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

DROP POLICY "Aluno assina seu relatorio" ON public.assinaturas_relatorio;
CREATE POLICY "Aluno assina seu relatorio" ON public.assinaturas_relatorio FOR INSERT TO authenticated
WITH CHECK (private.is_meu_aluno(aluno_id));

DROP POLICY "Aluno ve suas assinaturas" ON public.assinaturas_relatorio;
CREATE POLICY "Aluno ve suas assinaturas" ON public.assinaturas_relatorio FOR SELECT TO authenticated
USING (private.is_meu_aluno(aluno_id));

DROP POLICY "Staff gerencia assinaturas" ON public.assinaturas_relatorio;
CREATE POLICY "Staff gerencia assinaturas" ON public.assinaturas_relatorio FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

DROP POLICY "Aluno ve suas avaliacoes" ON public.avaliacoes;
CREATE POLICY "Aluno ve suas avaliacoes" ON public.avaliacoes FOR SELECT TO authenticated
USING (private.is_meu_aluno(aluno_id));

DROP POLICY "Staff gerencia avaliacoes" ON public.avaliacoes;
CREATE POLICY "Staff gerencia avaliacoes" ON public.avaliacoes FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

DROP POLICY "Aluno registra seu check-in" ON public.check_ins;
CREATE POLICY "Aluno registra seu check-in" ON public.check_ins FOR INSERT TO authenticated
WITH CHECK (private.is_meu_aluno(aluno_id));

DROP POLICY "Aluno ve seus check-ins" ON public.check_ins;
CREATE POLICY "Aluno ve seus check-ins" ON public.check_ins FOR SELECT TO authenticated
USING (private.is_meu_aluno(aluno_id));

DROP POLICY "Staff gerencia check-ins" ON public.check_ins;
CREATE POLICY "Staff gerencia check-ins" ON public.check_ins FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

DROP POLICY "Staff gerencia papeis" ON public.user_roles;
CREATE POLICY "Staff gerencia papeis" ON public.user_roles FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'staff')) WITH CHECK (private.has_role(auth.uid(), 'staff'));

DROP POLICY "Usuarios veem seus proprios papeis" ON public.user_roles;
CREATE POLICY "Usuarios veem seus proprios papeis" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'staff'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_meu_aluno(uuid);

-- ===== 20260812000000_executar_funcoes_private.sql =====
-- As policies RLS de todas as tabelas chamam private.has_role e private.is_meu_aluno. O Postgres
-- confere o privilégio EXECUTE do papel que faz a consulta (mesmo para funções SECURITY DEFINER),
-- então sem este GRANT toda leitura ou escrita de usuário logado falha com
-- "permission denied for function has_role". A migration 20260811172706 tirou o EXECUTE de
-- authenticated ao mover as funções para o schema private.
--
-- O schema private continua sem USAGE para anon e authenticated e fora da API do PostgREST: o EXECUTE
-- basta para a policy avaliar a função, mas ninguém consegue chamá-la pelo nome (private.has_role) via
-- API ou SQL de cliente, o que evitaria enumerar papéis de outras contas.
-- anon não recebe EXECUTE: nenhuma policy do projeto vale para anon.
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_meu_aluno(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_meu_aluno(uuid) TO authenticated, service_role;


-- ===== 20260812000100_private_meu_aluno_id.sql =====
-- Id da ficha de aluno ligada à conta logada (NULL se a conta não tem ficha). O índice único parcial
-- alunos_user_id_key garante no máximo uma ficha por conta.
--
-- Existe para as policies RLS: `aluno_id = (SELECT private.meu_aluno_id())` não depende da linha, então
-- o Postgres a avalia uma única vez por consulta (InitPlan) e ainda pode usar índice em aluno_id.
-- `private.is_meu_aluno(aluno_id)` é chamada uma vez por linha lida: em check_ins com 120 mil linhas a
-- consulta de um aluno levava ~1 s contra ~7 ms com esta forma. A semântica é a mesma de is_meu_aluno.
CREATE OR REPLACE FUNCTION private.meu_aluno_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$ SELECT a.id FROM public.alunos a WHERE a.user_id = auth.uid() $$;

-- Mesmo critério de private.has_role/is_meu_aluno: o EXECUTE de authenticated basta para a policy
-- avaliar a função; o schema private segue sem USAGE e fora da API.
REVOKE ALL ON FUNCTION private.meu_aluno_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.meu_aluno_id() TO authenticated, service_role;


-- ===== 20260908113916_alunos_turno_termo.sql =====
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


-- ===== 20260909093918_pagamentos.sql =====
-- Copiado de drizzle/migrations/0001_create_pagamentos.sql (trilho do Lovable), na versão idempotente.
CREATE TABLE IF NOT EXISTS public.pagamentos (
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

DROP POLICY IF EXISTS "Aluno ve seus pagamentos" ON public.pagamentos;
CREATE POLICY "Aluno ve seus pagamentos" ON public.pagamentos
  FOR SELECT TO authenticated
  USING (private.is_meu_aluno(aluno_id));

DROP POLICY IF EXISTS "Staff gerencia pagamentos" ON public.pagamentos;
CREATE POLICY "Staff gerencia pagamentos" ON public.pagamentos
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'staff'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'staff'::public.app_role));

CREATE INDEX IF NOT EXISTS pagamentos_aluno_idx ON public.pagamentos (aluno_id, vencimento);


-- ===== 20260911141941_aulas_presencas.sql =====
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


-- ===== 20261004000000_modulos_area_do_aluno.sql =====
-- Módulos da área do aluno: treinos, reservas de aula, metas, medidas corporais
-- e atualização segura dos dados de contato pelo próprio aluno.
-- Todas as tabelas seguem o padrão do projeto: o aluno enxerga só o que é dele
-- (private.meu_aluno_id) e a equipe (role 'staff') gerencia tudo.
--
-- Esta migration altera public.aulas (criada em 20260911141941) e usa as funções private.has_role e
-- private.meu_aluno_id (20260812000000 e 20260812000100), por isso precisa vir depois delas.
--
-- Nas policies, `(SELECT private.has_role((SELECT auth.uid()), 'staff'))` e
-- `aluno_id = (SELECT private.meu_aluno_id())` não dependem da linha: o Postgres as avalia uma vez
-- por consulta (InitPlan) em vez de uma vez por linha lida.

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

-- O UNIQUE (aula_id, aluno_id) já indexa as consultas por aula_id (coluna líder), então não há
-- índice separado só em aula_id.
CREATE TABLE public.reservas_aula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'reservada' CHECK (status IN ('reservada', 'cancelada')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (aula_id, aluno_id)
);

CREATE INDEX reservas_aula_aluno_id_idx ON public.reservas_aula(aluno_id);

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
-- O dia padrão é o de Brasília: current_date seguiria o fuso do servidor (UTC) e viraria o dia
-- seguinte a partir das 21h.
CREATE TABLE public.medidas_corporais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
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
USING (aluno_id = (SELECT private.meu_aluno_id()));
CREATE POLICY "Staff gerencia treinos" ON public.treinos FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

CREATE POLICY "Aluno ve exercicios dos seus treinos" ON public.treino_exercicios FOR SELECT TO authenticated
USING (treino_id IN (
  SELECT t.id FROM public.treinos t WHERE t.aluno_id = (SELECT private.meu_aluno_id())
));
CREATE POLICY "Staff gerencia exercicios" ON public.treino_exercicios FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

-- Reservas: o aluno reserva e cancela apenas as próprias. Lotação, data da aula e troca de aula ou de
-- aluno são validadas pelo trigger private.validar_reserva_aula (as policies não enxergam outras linhas).
CREATE POLICY "Aluno ve suas reservas" ON public.reservas_aula FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));
CREATE POLICY "Aluno reserva para si" ON public.reservas_aula FOR INSERT TO authenticated
WITH CHECK (aluno_id = (SELECT private.meu_aluno_id()) AND status = 'reservada');
CREATE POLICY "Aluno cancela sua reserva" ON public.reservas_aula FOR UPDATE TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()))
WITH CHECK (aluno_id = (SELECT private.meu_aluno_id()));
CREATE POLICY "Staff gerencia reservas" ON public.reservas_aula FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

-- Metas: o aluno gerencia as próprias; a equipe também.
CREATE POLICY "Aluno gerencia suas metas" ON public.metas_aluno FOR ALL TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()))
WITH CHECK (aluno_id = (SELECT private.meu_aluno_id()));
CREATE POLICY "Staff gerencia metas" ON public.metas_aluno FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

-- Medidas: aluno só lê; equipe registra na avaliação.
CREATE POLICY "Aluno ve suas medidas" ON public.medidas_corporais FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));
CREATE POLICY "Staff gerencia medidas" ON public.medidas_corporais FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

-- 6) Regras de reserva no banco ----------------------------------------------------------
-- A lotação não pode ficar só no servidor da aplicação (ler as vagas e depois gravar é uma corrida, e o
-- aluno consegue chamar o PostgREST direto). Este trigger vale para qualquer escrita de aluno:
--  * não deixa trocar a aula ou o aluno de uma reserva existente (cancele e reserve de novo);
--  * ao ocupar uma vaga (reserva nova ou reativação de uma cancelada) exige aula de hoje em diante e
--    vaga livre. O FOR NO KEY UPDATE na linha da aula serializa reservas simultâneas da mesma aula:
--    a segunda espera a primeira confirmar e já conta a vaga que ela ocupou.
-- Não vale para a equipe (que pode lotar uma aula de propósito) nem para quem não tem sessão de
-- usuário (service_role, migrations, SQL direto: auth.uid() é nulo).
-- SECURITY DEFINER porque o aluno não lê as reservas dos colegas nem toda a tabela aulas.
CREATE OR REPLACE FUNCTION private.validar_reserva_aula()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _uid uuid := auth.uid();
  _aula record;
  _ocupadas integer;
BEGIN
  IF _uid IS NULL OR private.has_role(_uid, 'staff') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND (NEW.aula_id <> OLD.aula_id OR NEW.aluno_id <> OLD.aluno_id) THEN
    RAISE EXCEPTION 'Não é possível trocar a aula ou o aluno de uma reserva. Cancele e reserve de novo.';
  END IF;

  IF NEW.status = 'reservada' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'reservada') THEN
    SELECT a.vagas, a.data INTO _aula
    FROM public.aulas a
    WHERE a.id = NEW.aula_id
    FOR NO KEY UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Aula não encontrada.';
    END IF;
    IF _aula.data < (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
      RAISE EXCEPTION 'Esta aula já aconteceu.';
    END IF;

    -- Exclui o próprio aluno: o upsert do app roda este trigger como INSERT mesmo quando a reserva
    -- dele já existe, e quem já tem a vaga não pode ser barrado por ela estar ocupada.
    SELECT count(*) INTO _ocupadas
    FROM public.reservas_aula r
    WHERE r.aula_id = NEW.aula_id AND r.status = 'reservada' AND r.aluno_id <> NEW.aluno_id;

    IF _ocupadas >= _aula.vagas THEN
      RAISE EXCEPTION 'Esta aula está lotada.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.validar_reserva_aula() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER reservas_aula_validar
  BEFORE INSERT OR UPDATE ON public.reservas_aula
  FOR EACH ROW EXECUTE FUNCTION private.validar_reserva_aula();

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

-- 7) Contato do aluno --------------------------------------------------------------------
-- O aluno altera só telefone e e-mail de contato do próprio cadastro
-- (a política de UPDATE em alunos continua restrita à equipe).
-- Fica em public porque o app a chama por supabase.rpc (só schemas expostos pelo PostgREST).
-- Valida aqui o mesmo que o servidor da aplicação, que o aluno pode contornar chamando o RPC direto,
-- e falha em vez de "salvar" sem efeito quando a conta não tem ficha vinculada.
CREATE OR REPLACE FUNCTION public.atualizar_meu_contato(_telefone text, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _tel text := NULLIF(btrim(_telefone), '');
  _mail text := NULLIF(btrim(_email), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Faça login para atualizar seus dados.';
  END IF;
  IF _tel IS NOT NULL AND _tel !~ '^[0-9()+.[:space:]-]{8,30}$' THEN
    RAISE EXCEPTION 'Telefone inválido.';
  END IF;
  IF _mail IS NOT NULL AND (char_length(_mail) > 160 OR _mail !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN
    RAISE EXCEPTION 'E-mail inválido.';
  END IF;

  UPDATE public.alunos
  SET telefone = _tel,
      email = _mail,
      updated_at = now()
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhum cadastro de aluno vinculado a esta conta.';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.atualizar_meu_contato(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atualizar_meu_contato(text, text) TO authenticated;

-- 8) Agenda futura de aulas ----------------------------------------------------------------
-- A agenda futura de aulas (modalidade, professor, horário e as observações que a equipe escreve para
-- os alunos, como "traga uma toalha") é visível a quem tem ficha de aluno vinculada, para permitir a
-- reserva. Conta sem vínculo (recém-cadastrada, sem perfil) não lê nada. O dia de corte é o de
-- Brasília: current_date seguiria o fuso do servidor (UTC) e esconderia as aulas "de hoje" a partir das
-- 21h. Aulas passadas continuam restritas a quem participou.
CREATE POLICY "Aluno ve agenda futura de aulas" ON public.aulas FOR SELECT TO authenticated
USING (
  data >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
  AND (SELECT private.meu_aluno_id()) IS NOT NULL
);


-- ===== 20261004120000_vinculos_atomicos_e_bootstrap_staff.sql =====
-- Vínculos aluno <-> conta e bootstrap do primeiro staff, ambos atômicos.
-- Migration idempotente: CREATE OR REPLACE + REVOKE/GRANT podem ser reaplicados sem efeito colateral.
-- As duas funções só são chamadas pelo servidor (service_role) e nunca pelo navegador.

-- ---------------------------------------------------------------------------------------------
-- 1. Bootstrap do primeiro staff
-- ---------------------------------------------------------------------------------------------
-- Antes, o servidor contava os staff e inseria o chamador em dois passos, para QUALQUER conta
-- autenticada: duas requisições simultâneas promoviam dois staff, e o primeiro cadastro de um
-- projeto novo virava administrador. Agora a promoção exige, dentro da mesma transação e sob
-- trava, que (a) ainda não exista nenhum staff e (b) a conta tenha o e-mail CONFIRMADO igual ao
-- e-mail autorizado (variável de ambiente STAFF_BOOTSTRAP_EMAIL, lida pelo servidor).
CREATE OR REPLACE FUNCTION public.bootstrap_primeiro_staff(_user_id uuid, _email_autorizado text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF _user_id IS NULL OR btrim(coalesce(_email_autorizado, '')) = '' THEN
    RETURN false;
  END IF;

  -- Serializa promoções concorrentes: a segunda espera a primeira confirmar e já enxerga o staff.
  PERFORM pg_advisory_xact_lock(hashtext('public.bootstrap_primeiro_staff'));

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'staff') THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = _user_id
      AND u.email_confirmed_at IS NOT NULL
      AND lower(u.email) = lower(btrim(_email_autorizado))
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'staff')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_primeiro_staff(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_primeiro_staff(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------------------------
-- 2. Vínculos em lote numa única transação
-- ---------------------------------------------------------------------------------------------
-- _itens: [{"alunoId": "<uuid>", "userId": "<uuid>" | null}, ...]. Devolve quantos alunos foram
-- processados. Tudo ou nada: se qualquer item for inválido, nada é gravado. Desvincula antes de
-- vincular (trocas de conta entre alunos do mesmo lote não violam alunos_user_id_key), concede o
-- papel 'aluno' às contas vinculadas e retira esse papel das contas que ficaram sem aluno.
CREATE OR REPLACE FUNCTION public.definir_vinculos(_itens jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _alunos uuid[];
  _contas uuid[];
  _anteriores uuid[];
  _msg text;
BEGIN
  IF _itens IS NULL OR jsonb_typeof(_itens) <> 'array' OR jsonb_array_length(_itens) = 0 THEN
    RAISE EXCEPTION 'Selecione ao menos um aluno.';
  END IF;

  SELECT array_agg((e ->> 'alunoId')::uuid ORDER BY n),
         array_agg(nullif(e ->> 'userId', '')::uuid ORDER BY n)
    INTO _alunos, _contas
  FROM jsonb_array_elements(_itens) WITH ORDINALITY AS t(e, n);

  IF EXISTS (SELECT 1 FROM unnest(_alunos) a WHERE a IS NULL) THEN
    RAISE EXCEPTION 'Aluno inválido.';
  END IF;
  IF (SELECT count(DISTINCT a) FROM unnest(_alunos) a) <> cardinality(_alunos) THEN
    RAISE EXCEPTION 'O mesmo aluno aparece mais de uma vez na lista.';
  END IF;
  IF (SELECT count(DISTINCT c) FROM unnest(_contas) c WHERE c IS NOT NULL)
     <> (SELECT count(c) FROM unnest(_contas) c) THEN
    RAISE EXCEPTION 'Cada conta só pode ser usada por um aluno.';
  END IF;

  -- Serializa alterações de vínculo: a checagem de conflito e a limpeza de papéis abaixo
  -- dependem de ninguém mexer nos vínculos ao mesmo tempo.
  PERFORM pg_advisory_xact_lock(hashtext('public.definir_vinculos'));

  IF (SELECT count(*) FROM public.alunos WHERE id = ANY (_alunos)) <> cardinality(_alunos) THEN
    RAISE EXCEPTION 'Aluno não encontrado. Atualize a página e tente de novo.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(_contas) c
    WHERE c IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c)
  ) THEN
    RAISE EXCEPTION 'Conta de acesso não encontrada. Atualize a página e tente de novo.';
  END IF;

  -- Defesa em profundidade: o e-mail da conta precisa estar confirmado, senão quem se cadastrasse
  -- com o e-mail de um aluno (sem ser dono dele) poderia ser ligado à ficha dele.
  SELECT u.email INTO _msg
  FROM auth.users u
  WHERE u.id = ANY (_contas) AND u.email_confirmed_at IS NULL
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'A conta % ainda não confirmou o e-mail. Peça ao aluno para confirmar antes de vincular.',
      coalesce(_msg, '(sem e-mail)');
  END IF;

  SELECT a.nome INTO _msg
  FROM public.alunos a
  WHERE a.user_id = ANY (_contas) AND NOT (a.id = ANY (_alunos))
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Esta conta já está vinculada a %.', _msg;
  END IF;

  _anteriores := ARRAY(
    SELECT DISTINCT a.user_id FROM public.alunos a
    WHERE a.id = ANY (_alunos) AND a.user_id IS NOT NULL
  );

  UPDATE public.alunos a
  SET user_id = NULL
  FROM unnest(_alunos, _contas) AS t(aluno_id, user_id)
  WHERE a.id = t.aluno_id
    AND a.user_id IS NOT NULL
    AND a.user_id IS DISTINCT FROM t.user_id;

  UPDATE public.alunos a
  SET user_id = t.user_id
  FROM unnest(_alunos, _contas) AS t(aluno_id, user_id)
  WHERE a.id = t.aluno_id
    AND t.user_id IS NOT NULL
    AND a.user_id IS DISTINCT FROM t.user_id;

  INSERT INTO public.user_roles (user_id, role)
  SELECT DISTINCT c, 'aluno'::public.app_role
  FROM unnest(_contas) c
  WHERE c IS NOT NULL
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Conta desvinculada (ou trocada) que não pertence mais a nenhum aluno deixa de ter o perfil
  -- 'aluno'. Só esse papel é removido: um 'staff' da mesma conta nunca é tocado.
  DELETE FROM public.user_roles r
  WHERE r.role = 'aluno'
    AND r.user_id = ANY (_anteriores)
    AND NOT EXISTS (SELECT 1 FROM public.alunos a WHERE a.user_id = r.user_id);

  RETURN cardinality(_alunos);
END;
$$;

REVOKE ALL ON FUNCTION public.definir_vinculos(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.definir_vinculos(jsonb) TO service_role;


-- ===== 20261004130000_politicas_rls_otimizadas.sql =====
-- Recria as policies das tabelas anteriores a 20261004000000 na forma que o Postgres avalia uma vez
-- por consulta, e não uma vez por linha lida:
--   (SELECT private.has_role((SELECT auth.uid()), 'staff'))   e   aluno_id = (SELECT private.meu_aluno_id())
-- não dependem da linha, então viram InitPlan. Chamadas diretas a private.has_role(auth.uid(), ...) e
-- private.is_meu_aluno(aluno_id) rodam por linha: em check_ins com 120 mil linhas, a leitura da equipe
-- caiu de ~330 ms para ~11 ms e a de um aluno de ~970 ms para ~7 ms (Postgres 16, medido localmente).
-- A semântica de acesso não muda; as tabelas novas de 20261004000000 já nascem nesta forma.
-- Idempotente: DROP POLICY IF EXISTS antes de cada CREATE POLICY.

-- alunos
DROP POLICY IF EXISTS "Staff gerencia alunos" ON public.alunos;
CREATE POLICY "Staff gerencia alunos" ON public.alunos FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve sua ficha" ON public.alunos;
CREATE POLICY "Aluno ve sua ficha" ON public.alunos FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

-- avaliacoes
DROP POLICY IF EXISTS "Staff gerencia avaliacoes" ON public.avaliacoes;
CREATE POLICY "Staff gerencia avaliacoes" ON public.avaliacoes FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve suas avaliacoes" ON public.avaliacoes;
CREATE POLICY "Aluno ve suas avaliacoes" ON public.avaliacoes FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));

-- check_ins
DROP POLICY IF EXISTS "Staff gerencia check-ins" ON public.check_ins;
CREATE POLICY "Staff gerencia check-ins" ON public.check_ins FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve seus check-ins" ON public.check_ins;
CREATE POLICY "Aluno ve seus check-ins" ON public.check_ins FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));

DROP POLICY IF EXISTS "Aluno registra seu check-in" ON public.check_ins;
CREATE POLICY "Aluno registra seu check-in" ON public.check_ins FOR INSERT TO authenticated
WITH CHECK (aluno_id = (SELECT private.meu_aluno_id()));

-- assinaturas_relatorio
-- O aluno não assina mais pelo banco: com a policy "Aluno assina seu relatorio" qualquer aluno logado
-- gravava, direto pelo PostgREST, uma assinatura com o nome que quisesse (inclusive o de um
-- profissional) e data retroativa. O app só LÊ esta tabela; a equipe segue gerenciando pela policy
-- abaixo. Se o aluno precisar assinar no futuro, a gravação deve ir por uma função que fixe o
-- assinante (nome do aluno) e a data (now()).
DROP POLICY IF EXISTS "Aluno assina seu relatorio" ON public.assinaturas_relatorio;

DROP POLICY IF EXISTS "Staff gerencia assinaturas" ON public.assinaturas_relatorio;
CREATE POLICY "Staff gerencia assinaturas" ON public.assinaturas_relatorio FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve suas assinaturas" ON public.assinaturas_relatorio;
CREATE POLICY "Aluno ve suas assinaturas" ON public.assinaturas_relatorio FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));

-- user_roles
DROP POLICY IF EXISTS "Staff gerencia papeis" ON public.user_roles;
CREATE POLICY "Staff gerencia papeis" ON public.user_roles FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Usuarios veem seus proprios papeis" ON public.user_roles;
CREATE POLICY "Usuarios veem seus proprios papeis" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR (SELECT private.has_role((SELECT auth.uid()), 'staff')));

-- pagamentos
DROP POLICY IF EXISTS "Staff gerencia pagamentos" ON public.pagamentos;
CREATE POLICY "Staff gerencia pagamentos" ON public.pagamentos FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve seus pagamentos" ON public.pagamentos;
CREATE POLICY "Aluno ve seus pagamentos" ON public.pagamentos FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));

-- aulas
DROP POLICY IF EXISTS "Staff gerencia aulas" ON public.aulas;
CREATE POLICY "Staff gerencia aulas" ON public.aulas FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve aulas que participou" ON public.aulas;
CREATE POLICY "Aluno ve aulas que participou" ON public.aulas FOR SELECT TO authenticated
USING (id IN (
  SELECT p.aula_id FROM public.aula_presencas p WHERE p.aluno_id = (SELECT private.meu_aluno_id())
));

-- aula_presencas
DROP POLICY IF EXISTS "Staff gerencia presencas" ON public.aula_presencas;
CREATE POLICY "Staff gerencia presencas" ON public.aula_presencas FOR ALL TO authenticated
USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));

DROP POLICY IF EXISTS "Aluno ve suas presencas" ON public.aula_presencas;
CREATE POLICY "Aluno ve suas presencas" ON public.aula_presencas FOR SELECT TO authenticated
USING (aluno_id = (SELECT private.meu_aluno_id()));


-- ===== 20261004130100_fk_user_id_auth_users.sql =====
-- user_roles.user_id e alunos.user_id guardavam o id de uma conta sem chave estrangeira. Ao excluir uma
-- conta no Supabase o papel ficava órfão (um staff excluído continuava contando como "já existe staff" e
-- travava a promoção do próximo) e a ficha do aluno seguia presa a uma conta inexistente, aparecendo
-- como vinculada sem e-mail na tela de vínculos.
--
-- Idempotente: a limpeza só atinge linhas órfãs e cada FK só é criada se ainda não existir.

-- 1) Remove o que já está órfão: o ADD CONSTRAINT falharia por causa dessas linhas.
DELETE FROM public.user_roles r
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.user_id);

UPDATE public.alunos a
SET user_id = NULL
WHERE a.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.user_id);

-- 2) Papéis seguem a conta (CASCADE); a ficha do aluno não é apagada com a conta, só desvinculada.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_roles'::regclass AND conname = 'user_roles_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.alunos'::regclass AND conname = 'alunos_user_id_fkey'
  ) THEN
    ALTER TABLE public.alunos
      ADD CONSTRAINT alunos_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ===== 20261004130200_restricoes_de_dominio.sql =====
-- Restrições de domínio que antes só existiam (quando existiam) nas server functions. Quem chama o
-- PostgREST direto não passa por elas: um aluno logado gravava check-ins de duração negativa ou em 2099,
-- e status de pagamento digitado errado ("pago", "Paga") virava "Pendente" sem aviso.
-- Idempotente e seguro para um banco com dados: nenhuma restrição é criada se alguma linha existente a
-- violar (o ALTER seria recusado, ou uma restrição NOT VALID bloquearia depois qualquer UPDATE de
-- linhas legadas). Nesse caso a migration segue e emite um WARNING com o nome da restrição: corrija as
-- linhas apontadas e rode de novo o bloco 3 (este arquivo é idempotente).

-- 1) Padroniza a caixa dos status legados para os valores que o código compara ('Pago' é exato).
--    'Atrasado' nunca é gravado: o código o deriva do vencimento, então vira 'Pendente'.
UPDATE public.alunos
SET status = CASE lower(btrim(status)) WHEN 'ativo' THEN 'Ativo' WHEN 'risco' THEN 'Risco' WHEN 'inativo' THEN 'Inativo' END
WHERE lower(btrim(status)) IN ('ativo', 'risco', 'inativo')
  AND status NOT IN ('Ativo', 'Risco', 'Inativo');

UPDATE public.pagamentos SET status = 'Pago' WHERE lower(btrim(status)) = 'pago' AND status <> 'Pago';
UPDATE public.pagamentos SET status = 'Pendente'
WHERE lower(btrim(status)) IN ('pendente', 'atrasado') AND status <> 'Pendente';

-- 2) Data do treino: não pode ser futura. Um CHECK com a data de hoje não é imutável (reavaliaria
--    diferente em restauração de backup), por isso é trigger. O dia de corte é o de Brasília, com 1 dia
--    de folga para relógios de aparelho adiantados.
CREATE OR REPLACE FUNCTION private.validar_data_check_in()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.data > (now() AT TIME ZONE 'America/Sao_Paulo')::date + 1 THEN
    RAISE EXCEPTION 'A data do treino não pode estar no futuro.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.validar_data_check_in() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS check_ins_validar_data ON public.check_ins;
CREATE TRIGGER check_ins_validar_data
  BEFORE INSERT OR UPDATE OF data ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION private.validar_data_check_in();

-- 3) CHECKs de domínio.
--    alunos.plano fica de fora de propósito: a lista de planos vive no catálogo do app
--    (src/lib/planos-catalogo.ts) e um CHECK rígido aqui bloquearia o cadastro de um plano novo.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('alunos', 'alunos_status_chk', $c$status IN ('Ativo', 'Risco', 'Inativo')$c$),
      ('alunos', 'alunos_progresso_chk', $c$progresso BETWEEN 0 AND 100$c$),
      ('alunos', 'alunos_frequencia_chk', $c$frequencia >= 0$c$),
      ('alunos', 'alunos_idade_chk', $c$idade > 0$c$),
      ('alunos', 'alunos_altura_chk', $c$altura > 0$c$),
      ('pagamentos', 'pagamentos_status_chk', $c$status IN ('Pago', 'Pendente')$c$),
      ('pagamentos', 'pagamentos_valor_chk', $c$valor >= 0$c$),
      ('pagamentos', 'pagamentos_parcela_chk', $c$parcela BETWEEN 1 AND total_parcelas$c$),
      ('pagamentos', 'pagamentos_pago_em_chk', $c$status <> 'Pago' OR pago_em IS NOT NULL$c$),
      ('check_ins', 'check_ins_duracao_chk', $c$duracao_min BETWEEN 1 AND 600$c$),
      ('check_ins', 'check_ins_atividade_chk', $c$char_length(atividade) BETWEEN 1 AND 80$c$)
    ) AS t(tabela, nome, expressao)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = format('public.%I', r.tabela)::regclass AND conname = r.nome
    ) THEN
      BEGIN
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s)', r.tabela, r.nome, r.expressao);
      EXCEPTION WHEN check_violation THEN
        RAISE WARNING 'Restrição % NÃO criada: há linhas em public.% que a violam (%). Corrija os dados e reexecute o bloco DO deste arquivo (SQL Editor ou psql -f).',
          r.nome, r.tabela, r.expressao;
      END;
    END IF;
  END LOOP;
END $$;


-- ===== 20261004130300_updated_at_e_indices.sql =====
-- 1) updated_at automático. As colunas tinham DEFAULT now() mas nada as atualizava: só alguns trechos do
--    código gravavam o valor à mão, então edições da equipe em alunos (termo, vínculo, ficha) deixavam o
--    carimbo na data de criação. O trigger carimba toda alteração, inclusive as feitas por SQL.
--    O código que ainda grava updated_at continua funcionando: o trigger sobrescreve com now().
CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.set_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS alunos_set_updated_at ON public.alunos;
CREATE TRIGGER alunos_set_updated_at
  BEFORE UPDATE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS aulas_set_updated_at ON public.aulas;
CREATE TRIGGER aulas_set_updated_at
  BEFORE UPDATE ON public.aulas
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS treinos_set_updated_at ON public.treinos;
CREATE TRIGGER treinos_set_updated_at
  BEFORE UPDATE ON public.treinos
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- 2) Índice redundante: UNIQUE (aula_id, aluno_id) de aula_presencas já atende as consultas por aula_id
--    (é a coluna líder do índice), e o salvarAula regrava todas as presenças a cada edição, pagando
--    escrita em dois índices à toa. O de aluno_id continua: não é coberto por outro.
DROP INDEX IF EXISTS public.idx_aula_presencas_aula;


-- ===== 20261010000000_salvar_aula.sql =====
-- Salvar aula + lista de presenças numa única transação.
-- Migration idempotente: ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE e REVOKE/GRANT podem ser
-- reaplicados sem efeito colateral.
--
-- Antes, o servidor fazia UPDATE da aula, DELETE de todas as presenças e INSERT das novas em três
-- requisições independentes. Se o INSERT falhasse (aluno removido no meio da edição, timeout, queda de
-- rede), as presenças antigas já tinham sido apagadas e a lista se perdia; na criação, a aula ficava
-- sem presentes e o "Salvar" seguinte criava uma aula duplicada. Agora tudo roda aqui: qualquer erro
-- desfaz a operação inteira e as presenças anteriores continuam como estavam.
--
-- SECURITY INVOKER de propósito: a função roda com os privilégios de quem chamou, então as policies
-- "Staff gerencia aulas" e "Staff gerencia presencas" continuam valendo (um aluno que chame o RPC
-- direto recebe erro). A checagem explícita de staff abaixo só dá uma mensagem clara.

-- A função usa aulas.vagas (20261004000000). Garante a coluna caso esta migration seja aplicada num
-- banco em que aquela ainda não rodou; onde a coluna já existe, não faz nada.
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS vagas integer NOT NULL DEFAULT 20 CHECK (vagas > 0);

-- Os parâmetros com DEFAULT precisam vir por último (regra do PostgreSQL); o PostgREST chama por nome.
--   _id        NULL cria a aula; um uuid atualiza a aula existente (e falha se ela não existir mais).
--   _vagas     NULL mantém as vagas atuais ao atualizar e usa 20 (o padrão da coluna) ao criar.
--   _aluno_ids é a lista COMPLETA de presentes: quem não está nela perde a presença, quem já tinha
--              mantém a linha original, e os novos entram. NULL equivale a lista vazia.
-- Devolve o id da aula.
CREATE OR REPLACE FUNCTION public.salvar_aula(
  _data date,
  _modalidade text,
  _horario text,
  _professor text,
  _observacoes text,
  _aluno_ids uuid[],
  _id uuid DEFAULT NULL,
  _vagas integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  _aula uuid;
  _ids uuid[];
BEGIN
  -- Lê user_roles (cada um enxerga as próprias linhas) em vez de chamar private.has_role: o schema
  -- private não é acessível a authenticated, e uma função INVOKER resolve o nome em tempo de execução.
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = (SELECT auth.uid()) AND r.role = 'staff'::public.app_role
  ) THEN
    RAISE EXCEPTION 'Apenas a equipe (staff) pode gerenciar as aulas.';
  END IF;

  IF _data IS NULL THEN
    RAISE EXCEPTION 'Informe a data da aula.';
  END IF;
  IF btrim(coalesce(_modalidade, '')) = '' THEN
    RAISE EXCEPTION 'Informe a modalidade.';
  END IF;
  IF _horario IS NULL OR _horario !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'Informe um horário válido (HH:MM).';
  END IF;
  IF _vagas IS NOT NULL AND _vagas < 1 THEN
    RAISE EXCEPTION 'As vagas devem ser um número inteiro maior que zero.';
  END IF;

  -- Sem repetidos nem nulos: o UNIQUE (aula_id, aluno_id) nunca pode ser tropeçado por um clique duplo.
  _ids := ARRAY(SELECT DISTINCT x FROM unnest(coalesce(_aluno_ids, '{}'::uuid[])) AS x WHERE x IS NOT NULL);

  IF (SELECT count(*) FROM public.alunos a WHERE a.id = ANY (_ids)) <> cardinality(_ids) THEN
    RAISE EXCEPTION 'Algum aluno marcado não foi encontrado. Atualize a página e tente de novo.';
  END IF;

  IF _id IS NULL THEN
    INSERT INTO public.aulas (data, modalidade, horario, professor, observacoes, vagas)
    VALUES (
      _data,
      btrim(_modalidade),
      _horario,
      btrim(coalesce(_professor, '')),
      btrim(coalesce(_observacoes, '')),
      coalesce(_vagas, 20)
    )
    RETURNING id INTO _aula;
  ELSE
    -- O UPDATE trava a linha da aula até o fim da transação: duas pessoas salvando a mesma aula ao
    -- mesmo tempo são atendidas uma depois da outra, sem entrelaçar as presenças.
    UPDATE public.aulas
    SET data = _data,
        modalidade = btrim(_modalidade),
        horario = _horario,
        professor = btrim(coalesce(_professor, '')),
        observacoes = btrim(coalesce(_observacoes, '')),
        vagas = coalesce(_vagas, vagas),
        updated_at = now()
    WHERE id = _id
    RETURNING id INTO _aula;

    IF _aula IS NULL THEN
      RAISE EXCEPTION 'Esta aula não foi encontrada. Ela pode ter sido excluída por outra pessoa.';
    END IF;
  END IF;

  DELETE FROM public.aula_presencas p
  WHERE p.aula_id = _aula
    AND NOT (p.aluno_id = ANY (_ids));

  INSERT INTO public.aula_presencas (aula_id, aluno_id)
  SELECT _aula, x FROM unnest(_ids) AS x
  ON CONFLICT (aula_id, aluno_id) DO NOTHING;

  RETURN _aula;
END;
$$;

REVOKE ALL ON FUNCTION public.salvar_aula(date, text, text, text, text, uuid[], uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_aula(date, text, text, text, text, uuid[], uuid, integer)
  TO authenticated, service_role;

-- Faz o PostgREST enxergar a função já (o Supabase também recarrega sozinho depois de DDL).
NOTIFY pgrst, 'reload schema';


-- ===== 20261010000100_planos_precos.sql =====
-- Valores dos planos da academia: NÃO são públicos.
--
-- Só a equipe (role 'staff') e alunos com plano ativo (alunos.status = 'Ativo' ou 'Risco') leem esta
-- tabela. Visitantes sem login (anon) e alunos inativos não enxergam nenhuma linha. A lista de planos
-- (nomes, o que inclui) vive no código (src/lib/planos-info.ts); aqui ficam só as condições comerciais.
--
-- Os valores reais NÃO vão para o repositório (ele é público): depois desta migration, rode o SQL de
-- carga que a academia guarda em local privado. O arquivo supabase/seeds/planos_precos.exemplo.sql
-- mostra o formato com valores fictícios.
--
-- Usa private.has_role (20260812000000) e a mesma forma de policy de 20261004130000, que o Postgres
-- avalia uma vez por consulta. Idempotente.

-- Decide o acesso num lugar só. SECURITY DEFINER para ler public.alunos e public.user_roles sem
-- depender das policies dessas tabelas; só devolve um boolean sobre quem está logado.
CREATE OR REPLACE FUNCTION private.pode_ver_precos_planos()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.has_role((SELECT auth.uid()), 'staff')
      OR EXISTS (
        SELECT 1 FROM public.alunos a
        WHERE a.user_id = (SELECT auth.uid()) AND a.status IN ('Ativo', 'Risco')
      )
$$;

REVOKE ALL ON FUNCTION private.pode_ver_precos_planos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.pode_ver_precos_planos() TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.planos_precos (
  -- Mesmo slug de src/lib/planos-info.ts.
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  matricula numeric(10, 2) NOT NULL DEFAULT 0 CHECK (matricula >= 0),
  -- [{"label": "Anual", "valor": 180, "parcelas": 12}, ...]
  opcoes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(opcoes) = 'array'),
  -- Opção família (mesmo formato de uma opção), ou NULL.
  familia jsonb CHECK (familia IS NULL OR jsonb_typeof(familia) = 'object'),
  -- Condições de pagamento exibidas junto do plano.
  observacoes text[] NOT NULL DEFAULT '{}',
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.planos_precos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.planos_precos FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planos_precos TO authenticated;
GRANT ALL ON public.planos_precos TO service_role;

DROP POLICY IF EXISTS "Equipe e alunos ativos veem os precos" ON public.planos_precos;
CREATE POLICY "Equipe e alunos ativos veem os precos" ON public.planos_precos
  FOR SELECT TO authenticated
  USING ((SELECT private.pode_ver_precos_planos()));

DROP POLICY IF EXISTS "Equipe gerencia os precos" ON public.planos_precos;
CREATE POLICY "Equipe gerencia os precos" ON public.planos_precos
  FOR ALL TO authenticated
  USING ((SELECT private.has_role((SELECT auth.uid()), 'staff')))
  WITH CHECK ((SELECT private.has_role((SELECT auth.uid()), 'staff')));


-- ===== 20261011000000_papeis_equipe_valores.sql =====
-- Perfis de acesso da equipe (parte 1: novos valores do enum).
-- Fica em arquivo separado porque um valor novo de enum não pode ser usado na mesma transação em que
-- é criado; as políticas que o usam estão em 20261011000100_papeis_equipe.sql.
--   staff      = gestão: acesso total (papel que já existia).
--   recepcao   = cadastro, vínculos, aulas, presenças, termos e financeiro; NÃO vê avaliações físicas,
--                medidas, metas nem treinos.
--   professor  = treinos, avaliações, medidas, metas, aulas e presenças; NÃO vê financeiro nem valores.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recepcao';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professor';

