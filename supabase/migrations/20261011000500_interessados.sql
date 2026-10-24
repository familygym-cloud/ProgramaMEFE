-- Interessados (leads): quem pede matrícula, visita ou tira dúvida pelo formulário público do site.
-- Só o servidor do site grava (função public.registrar_interessado, service_role); gestão e recepção
-- leem e acompanham pelo painel. Quem preenche o formulário não tem conta e não lê nada.

CREATE TABLE IF NOT EXISTS public.interessados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 100),
  telefone text NOT NULL CHECK (telefone ~ '^[0-9]{10,13}$'),
  email text CHECK (email IS NULL OR char_length(email) <= 160),
  tipo text NOT NULL CHECK (tipo IN ('matricula', 'visita', 'duvida')),
  interesse text NOT NULL CHECK (char_length(interesse) BETWEEN 1 AND 60),
  mensagem text CHECK (mensagem IS NULL OR char_length(mensagem) <= 500),
  consentimento_em timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'matriculado', 'descartado')),
  anotacao text CHECK (anotacao IS NULL OR char_length(anotacao) <= 500),
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS interessados_status_idx ON public.interessados (status, criado_em DESC);
CREATE INDEX IF NOT EXISTS interessados_telefone_idx ON public.interessados (telefone, criado_em DESC);

ALTER TABLE public.interessados ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.interessados FROM PUBLIC, anon;
GRANT SELECT, UPDATE ON public.interessados TO authenticated;
GRANT ALL ON public.interessados TO service_role;

DROP POLICY IF EXISTS "Equipe le interessados" ON public.interessados;
CREATE POLICY "Equipe le interessados" ON public.interessados FOR SELECT TO authenticated
USING ((SELECT private.equipe(ARRAY['staff', 'recepcao'])));

DROP POLICY IF EXISTS "Equipe acompanha interessados" ON public.interessados;
CREATE POLICY "Equipe acompanha interessados" ON public.interessados FOR UPDATE TO authenticated
USING ((SELECT private.equipe(ARRAY['staff', 'recepcao'])))
WITH CHECK ((SELECT private.equipe(ARRAY['staff', 'recepcao'])));

-- Só status e anotação mudam pelo painel: o resto do cadastro é o que a pessoa informou.
CREATE OR REPLACE FUNCTION private.interessados_so_acompanhamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.nome IS DISTINCT FROM OLD.nome OR NEW.telefone IS DISTINCT FROM OLD.telefone
     OR NEW.email IS DISTINCT FROM OLD.email OR NEW.tipo IS DISTINCT FROM OLD.tipo
     OR NEW.interesse IS DISTINCT FROM OLD.interesse OR NEW.mensagem IS DISTINCT FROM OLD.mensagem
     OR NEW.consentimento_em IS DISTINCT FROM OLD.consentimento_em
     OR NEW.criado_em IS DISTINCT FROM OLD.criado_em THEN
    RAISE EXCEPTION 'Só o status e a anotação de um interessado podem ser alterados.';
  END IF;
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.interessados_so_acompanhamento() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS interessados_acompanhamento ON public.interessados;
CREATE TRIGGER interessados_acompanhamento
  BEFORE UPDATE ON public.interessados
  FOR EACH ROW EXECUTE FUNCTION private.interessados_so_acompanhamento();

-- Registro vindo do site. Devolve 'registrado' ou 'duplicado' (mesmo telefone e mesmo tipo nas
-- últimas 24 horas: ninguém precisa de dois contatos pelo mesmo pedido). Limite de segurança contra
-- inundação: no máximo 300 pedidos por hora no total.
CREATE OR REPLACE FUNCTION public.registrar_interessado(
  _nome text, _telefone text, _email text, _tipo text, _interesse text, _mensagem text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT count(*) FROM public.interessados WHERE criado_em > now() - interval '1 hour') >= 300 THEN
    RAISE EXCEPTION 'Muitos pedidos no momento. Tente de novo em alguns minutos.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.interessados
    WHERE telefone = _telefone AND tipo = _tipo AND criado_em > now() - interval '24 hours'
  ) THEN
    RETURN 'duplicado';
  END IF;
  INSERT INTO public.interessados (nome, telefone, email, tipo, interesse, mensagem, consentimento_em)
  VALUES (btrim(_nome), _telefone, nullif(btrim(_email), ''), _tipo, btrim(_interesse),
          nullif(btrim(_mensagem), ''), now());
  RETURN 'registrado';
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_interessado(text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_interessado(text, text, text, text, text, text) TO service_role;
