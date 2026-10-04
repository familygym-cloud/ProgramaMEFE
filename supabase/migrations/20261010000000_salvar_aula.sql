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
