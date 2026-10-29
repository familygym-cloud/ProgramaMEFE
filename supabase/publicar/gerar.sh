#!/usr/bin/env bash
# Gera os dois arquivos SQL para colar no SQL Editor do Supabase (quem não usa a Supabase CLI).
# A divisão existe porque um valor novo de enum (papéis recepcao e professor) só pode ser usado em
# outra transação: a parte 1 termina na migration que o cria e a parte 2 recomeça na seguinte.
# Rode de novo sempre que houver migration nova.
set -euo pipefail
cd "$(dirname "$0")/.."
LIMITE="20261011000000_papeis_equipe_valores.sql"
P1=publicar/1-banco-parte-1.sql
P2=publicar/2-banco-parte-2.sql
cabecalho() { printf -- "-- %s\n-- Gerado por supabase/publicar/gerar.sh a partir de supabase/migrations. Cole TODO o conteúdo no SQL Editor e clique em Run.\n\n" "$1"; }
cabecalho "PARTE 1 de 2: esquema do banco até a criação dos perfis da equipe" > "$P1"
cabecalho "PARTE 2 de 2: perfis da equipe, lista de espera, integrações, interessados, LGPD e cargas por exercício. Rode DEPOIS da parte 1." > "$P2"
parte=1
for f in migrations/*.sql; do
  nome=$(basename "$f")
  alvo=$P1; [ $parte -eq 2 ] && alvo=$P2
  { printf -- "\n-- ===== %s =====\n" "$nome"; cat "$f"; printf "\n"; } >> "$alvo"
  [ "$nome" = "$LIMITE" ] && parte=2
done

# Quem já publicou antes só precisa rodar as migrations novas: cada uma vira um arquivo em atualizacoes/.
# Todas são idempotentes (podem rodar de novo sem estragar nada).
PRIMEIRA_ATUALIZACAO="20261011000700_registros_carga.sql"
mkdir -p publicar/atualizacoes
rm -f publicar/atualizacoes/*.sql
for f in migrations/*.sql; do
  nome=$(basename "$f")
  if [[ "$nome" > "$PRIMEIRA_ATUALIZACAO" || "$nome" == "$PRIMEIRA_ATUALIZACAO" ]]; then
    { printf -- "-- ATUALIZAÇÃO %s\n-- Para quem já rodou as partes 1 e 2. Cole TODO o conteúdo no SQL Editor do Supabase e clique em Run.\n\n" "$nome"; cat "$f"; } > "publicar/atualizacoes/$nome"
  fi
done
echo "Gerados: $P1 ($(wc -l < $P1) linhas) e $P2 ($(wc -l < $P2) linhas)"
