-- Lista de espera nas aulas lotadas.
--  * reservas_aula.status passa a aceitar 'espera' (fila por ordem de created_at);
--  * quando uma vaga abre (reserva cancelada ou removida, ou a aula ganha vagas), o primeiro da fila
--    vira 'reservada' sozinho, dentro da mesma transação, e fica marcado em promovida_em para o app
--    avisá-lo;
--  * o aluno só entra na fila de uma aula realmente lotada e que ainda não aconteceu.
-- Idempotente onde possível.

-- 1) Status e marca de promoção ----------------------------------------------------------------
ALTER TABLE public.reservas_aula ADD COLUMN IF NOT EXISTS promovida_em timestamp with time zone;

DO $$
DECLARE
  _nome text;
BEGIN
  FOR _nome IN
    SELECT c.conname FROM pg_constraint c
    WHERE c.conrelid = 'public.reservas_aula'::regclass AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.reservas_aula DROP CONSTRAINT %I', _nome);
  END LOOP;
  ALTER TABLE public.reservas_aula
    ADD CONSTRAINT reservas_aula_status_check CHECK (status IN ('reservada', 'cancelada', 'espera'));
END $$;

CREATE INDEX IF NOT EXISTS reservas_aula_fila_idx
  ON public.reservas_aula (aula_id, created_at) WHERE status = 'espera';

-- O aluno pode inserir a própria reserva como 'reservada' ou 'espera' (o trigger valida a lotação).
DROP POLICY IF EXISTS "Aluno reserva para si" ON public.reservas_aula;
CREATE POLICY "Aluno reserva para si" ON public.reservas_aula FOR INSERT TO authenticated
WITH CHECK (aluno_id = (SELECT private.meu_aluno_id()) AND status IN ('reservada', 'espera'));

-- 2) Promoção da fila --------------------------------------------------------------------------
-- Trava a aula (serializa com reservas e cancelamentos simultâneos) e promove, na ordem de chegada,
-- enquanto houver vaga. Roda como dono da função: o aluno que cancelou não enxerga a fila dos outros.
CREATE OR REPLACE FUNCTION private.promover_fila(_aula uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _vagas integer;
  _data date;
  _livres integer;
  _proximo uuid;
BEGIN
  SELECT a.vagas, a.data INTO _vagas, _data
  FROM public.aulas a WHERE a.id = _aula
  FOR NO KEY UPDATE;
  IF NOT FOUND OR _data < (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
    RETURN;
  END IF;

  LOOP
    SELECT _vagas - count(*) INTO _livres
    FROM public.reservas_aula r WHERE r.aula_id = _aula AND r.status = 'reservada';
    EXIT WHEN _livres <= 0;

    SELECT r.id INTO _proximo
    FROM public.reservas_aula r
    WHERE r.aula_id = _aula AND r.status = 'espera'
    ORDER BY r.created_at, r.id
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    EXIT WHEN _proximo IS NULL;

    UPDATE public.reservas_aula
    SET status = 'reservada', promovida_em = now()
    WHERE id = _proximo;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION private.promover_fila(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.reservas_promover_fila()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'reservada' THEN PERFORM private.promover_fila(OLD.aula_id); END IF;
  ELSIF OLD.status = 'reservada' AND NEW.status <> 'reservada' THEN
    PERFORM private.promover_fila(NEW.aula_id);
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION private.reservas_promover_fila() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reservas_aula_promover ON public.reservas_aula;
CREATE TRIGGER reservas_aula_promover
  AFTER UPDATE OF status OR DELETE ON public.reservas_aula
  FOR EACH ROW EXECUTE FUNCTION private.reservas_promover_fila();

CREATE OR REPLACE FUNCTION private.aulas_promover_fila()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.vagas > OLD.vagas THEN PERFORM private.promover_fila(NEW.id); END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION private.aulas_promover_fila() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS aulas_promover ON public.aulas;
CREATE TRIGGER aulas_promover
  AFTER UPDATE OF vagas ON public.aulas
  FOR EACH ROW EXECUTE FUNCTION private.aulas_promover_fila();

-- 3) Regras de escrita do aluno (mesma função de 20261011000100, agora com 'espera') -----------
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
  IF _uid IS NULL OR EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = _uid AND r.role::text IN ('staff', 'recepcao', 'professor')
  ) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND (NEW.aula_id <> OLD.aula_id OR NEW.aluno_id <> OLD.aluno_id) THEN
    RAISE EXCEPTION 'Não é possível trocar a aula ou o aluno de uma reserva. Cancele e reserve de novo.';
  END IF;

  IF NEW.status IN ('reservada', 'espera')
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
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

    IF NEW.status = 'reservada' AND _ocupadas >= _aula.vagas THEN
      RAISE EXCEPTION 'Esta aula está lotada.';
    END IF;
    IF NEW.status = 'espera' AND _ocupadas < _aula.vagas THEN
      RAISE EXCEPTION 'Esta aula ainda tem vagas: reserve direto.';
    END IF;
    IF NEW.status = 'espera' THEN
      -- Quem volta para a fila entra no fim dela.
      NEW.created_at := clock_timestamp();
      NEW.promovida_em := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.validar_reserva_aula() FROM PUBLIC, anon, authenticated;

-- 4) Posição do aluno na fila, sem expor os outros ----------------------------------------------
CREATE OR REPLACE FUNCTION public.minha_posicao_na_fila(_aula_ids uuid[])
RETURNS TABLE (aula_id uuid, posicao bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT m.aula_id,
         (SELECT count(*) FROM public.reservas_aula o
          WHERE o.aula_id = m.aula_id AND o.status = 'espera'
            AND (o.created_at, o.id) <= (m.created_at, m.id))
  FROM public.reservas_aula m
  WHERE m.aluno_id = (SELECT private.meu_aluno_id())
    AND m.status = 'espera'
    AND m.aula_id = ANY (_aula_ids)
$$;
REVOKE ALL ON FUNCTION public.minha_posicao_na_fila(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.minha_posicao_na_fila(uuid[]) TO authenticated;
