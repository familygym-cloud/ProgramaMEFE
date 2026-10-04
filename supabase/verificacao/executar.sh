#!/usr/bin/env bash
# Verifica migrations, RLS, permissões e regras de negócio do banco em um Postgres DESCARTÁVEL.
#
#   CONFIRMO_BANCO_DESCARTAVEL=sim DATABASE_URL=postgresql://postgres@localhost:5432/teste \
#     supabase/verificacao/executar.sh --stubs --migrar --concorrencia
#
# --stubs         cria papéis, schema auth e auth.uid() (só para Postgres puro; não use no Supabase)
# --migrar        aplica toda a cadeia supabase/migrations em ordem, cada arquivo numa transação
# --concorrencia  roda também o teste de duas sessões reservando a última vaga
# --tipos         confere tabelas e colunas de src/integrations/supabase/types.ts com o banco (precisa de node)
#
# Sem flags, só carrega os dados e roda os testes (ex.: Supabase local após `supabase db reset`).
# Os testes inserem e apagam contas e alunos: NUNCA aponte para um banco com dados reais.
set -euo pipefail
cd "$(dirname "$0")"

if [[ "${CONFIRMO_BANCO_DESCARTAVEL:-}" != "sim" ]]; then
  echo "Recusado: este script grava dados de teste. Aponte DATABASE_URL para um banco descartável e" >&2
  echo "defina CONFIRMO_BANCO_DESCARTAVEL=sim." >&2
  exit 1
fi
: "${DATABASE_URL:?Defina DATABASE_URL (conexão com superusuário/dono do banco descartável).}"

STUBS=0; MIGRAR=0; CONCORRENCIA=0; TIPOS=0
for arg in "$@"; do
  case "$arg" in
    --stubs) STUBS=1 ;;
    --migrar) MIGRAR=1 ;;
    --concorrencia) CONCORRENCIA=1 ;;
    --tipos) TIPOS=1 ;;
    *) echo "Opção desconhecida: $arg" >&2; exit 1 ;;
  esac
done

PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q)

if (( STUBS )); then "${PSQL[@]}" -f 00_stubs_postgres_puro.sql; fi
if (( MIGRAR )); then
  for arquivo in ../migrations/*.sql; do
    "${PSQL[@]}" --single-transaction -f "$arquivo" >/dev/null
    echo "migration aplicada: $(basename "$arquivo")"
  done
fi

"${PSQL[@]}" -f 01_ajudantes.sql
"${PSQL[@]}" -f 02_dados.sql
"${PSQL[@]}" -f 03_testes.sql
"${PSQL[@]}" -f 04_salvar_aula.sql
"${PSQL[@]}" -f 05_planos_precos.sql
if (( CONCORRENCIA )); then DATABASE_URL="$DATABASE_URL" ./concorrencia.sh; fi
if (( TIPOS )); then DATABASE_URL="$DATABASE_URL" node comparar_tipos.mjs; fi
