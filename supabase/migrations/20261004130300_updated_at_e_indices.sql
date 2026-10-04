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
