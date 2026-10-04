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
