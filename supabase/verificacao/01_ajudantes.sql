-- Ajudantes dos testes (schema t, descartável). Executar como superusuário/dono do banco.
-- t.login(uid, papel) assume o papel dentro da transação e define o JWT de teste (claim sub), como o PostgREST.
DROP SCHEMA IF EXISTS t CASCADE;
CREATE SCHEMA t;
GRANT USAGE ON SCHEMA t TO anon, authenticated, service_role;

CREATE FUNCTION t.login(uid uuid, papel text DEFAULT 'authenticated') RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', COALESCE(uid::text, ''), true);
  EXECUTE format('SET LOCAL ROLE %I', papel);
END $$;

CREATE FUNCTION t.logout() RETURNS void LANGUAGE plpgsql AS $$ BEGIN RESET ROLE; END $$;

CREATE FUNCTION t.ok(cond boolean, msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF cond IS DISTINCT FROM true THEN RAISE EXCEPTION 'FALHOU: %', msg; END IF;
  RAISE NOTICE 'ok: %', msg;
END $$;

CREATE FUNCTION t.n(q text) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE r bigint; BEGIN EXECUTE 'select count(*) from (' || q || ') s' INTO r; RETURN r; END $$;

-- Executa sql e exige erro. padrao: trecho esperado na mensagem; estado: SQLSTATE esperado (opcional).
CREATE FUNCTION t.erro(q text, padrao text, estado text DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE q;
  EXCEPTION WHEN OTHERS THEN
    IF position(padrao in SQLERRM) = 0 THEN RAISE EXCEPTION 'FALHOU: erro inesperado para [%]: % (%)', q, SQLERRM, SQLSTATE; END IF;
    IF estado IS NOT NULL AND SQLSTATE <> estado THEN RAISE EXCEPTION 'FALHOU: sqlstate % <> % para [%]', SQLSTATE, estado, q; END IF;
    RAISE NOTICE 'ok: erro esperado (%) em [%]', SQLERRM, left(q, 70);
    RETURN;
  END;
  RAISE EXCEPTION 'FALHOU: deveria falhar: [%]', q;
END $$;

-- Executa sql e exige sucesso.
CREATE FUNCTION t.sucesso(q text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE q;
  RAISE NOTICE 'ok: [%]', left(q, 80);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'FALHOU: deveria passar [%]: % (%)', q, SQLERRM, SQLSTATE;
END $$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA t TO anon, authenticated, service_role;
