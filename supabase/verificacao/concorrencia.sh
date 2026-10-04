#!/usr/bin/env bash
# Duas sessões reservam ao mesmo tempo a última vaga de uma aula: a segunda deve esperar a primeira
# confirmar e ser recusada com "Esta aula está lotada." (trigger private.validar_reserva_aula).
# Chamado por executar.sh --concorrencia; usa DATABASE_URL de um banco DESCARTÁVEL já migrado.
set -euo pipefail

PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=0 -q -At)
SAIDA2="$(mktemp)"
trap 'rm -f "$SAIDA2"' EXIT

"${PSQL[@]}" >/dev/null <<'SQL'
INSERT INTO auth.users(id, email) VALUES
  ('55555555-5555-5555-5555-555555555555', 'c1@x.com'),
  ('66666666-6666-6666-6666-666666666666', 'c2@x.com');
UPDATE public.alunos SET user_id = '55555555-5555-5555-5555-555555555555' WHERE nome = 'Marina Souza';
UPDATE public.alunos SET user_id = '66666666-6666-6666-6666-666666666666' WHERE nome = 'Pedro Nogueira';
INSERT INTO public.aulas(id, data, modalidade, horario, vagas)
  VALUES ('a0000000-0000-0000-0000-0000000000c1', (now() AT TIME ZONE 'America/Sao_Paulo')::date + 1, 'Spinning', '07:00', 1);
SQL
ALUNO1="$("${PSQL[@]}" -c "SELECT id FROM public.alunos WHERE nome = 'Marina Souza'")"
ALUNO2="$("${PSQL[@]}" -c "SELECT id FROM public.alunos WHERE nome = 'Pedro Nogueira'")"

"${PSQL[@]}" >/dev/null <<SQL &
BEGIN;
SELECT set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
SET LOCAL ROLE authenticated;
INSERT INTO public.reservas_aula(aula_id, aluno_id) VALUES ('a0000000-0000-0000-0000-0000000000c1', '$ALUNO1');
SELECT pg_sleep(3);
COMMIT;
SQL
PRIMEIRA=$!
sleep 1
INICIO=$(date +%s)
"${PSQL[@]}" >"$SAIDA2" 2>&1 <<SQL || true
BEGIN;
SELECT set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);
SET LOCAL ROLE authenticated;
INSERT INTO public.reservas_aula(aula_id, aluno_id) VALUES ('a0000000-0000-0000-0000-0000000000c1', '$ALUNO2');
COMMIT;
SQL
FIM=$(date +%s)
wait "$PRIMEIRA"

OCUPADAS="$("${PSQL[@]}" -c "SELECT count(*) FROM public.reservas_aula WHERE aula_id = 'a0000000-0000-0000-0000-0000000000c1' AND status = 'reservada'")"
if grep -q "Esta aula está lotada." "$SAIDA2" && [[ "$OCUPADAS" == "1" ]] && (( FIM - INICIO >= 1 )); then
  echo "ok: a segunda reserva esperou a primeira ($((FIM - INICIO)) s) e foi recusada; vagas ocupadas = $OCUPADAS"
else
  echo "FALHOU: concorrência. vagas ocupadas = $OCUPADAS; saída da segunda sessão:" >&2
  cat "$SAIDA2" >&2
  exit 1
fi
