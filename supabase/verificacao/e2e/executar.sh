#!/usr/bin/env bash
# Teste de ponta a ponta do site PUBLICADO (o mesmo pacote que vai para a Cloudflare), sem internet:
# constrói o site apontando para um Supabase de mentira, sobe o servidor de produção local (wrangler dev)
# e abre as telas da equipe e o diagnóstico em vários cenários de configuração errada.
#
#   supabase/verificacao/e2e/executar.sh
#
# Precisa do Playwright (npm i -g playwright). Não toca em nenhum banco nem serviço real.
set -uo pipefail
cd "$(dirname "$0")/../../.."
FALSO=supabase/verificacao/e2e/supabase-falso.mjs
FUMACA=supabase/verificacao/e2e/fumaca.mjs
SITE=http://127.0.0.1:8787
FALHAS=0

parar() { for porta in 54321 8787; do kill $(lsof -ti:$porta) 2>/dev/null; done; }
trap parar EXIT

echo "== construindo o site (aponta para o Supabase de mentira)"
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_teste \
  VITE_SITE_URL=$SITE bun run build >/tmp/e2e-build.log 2>&1 || { tail -20 /tmp/e2e-build.log; exit 1; }

subir() { # $1 = variáveis do Supabase falso, $2 = variáveis do servidor
  parar; sleep 2
  env $1 node $FALSO >/tmp/e2e-falso.log 2>&1 &
  # A data de compatibilidade do build é a de hoje; o workerd local pode ser mais antigo.
  WRANGLER_SEND_METRICS=false bunx wrangler dev --config .output/server/wrangler.json \
    --compatibility-date "${E2E_COMPAT_DATE:-2026-10-08}" --port 8787 --ip 127.0.0.1 $2 >/tmp/e2e-worker.log 2>&1 &
  for _ in $(seq 1 60); do curl -s -m 2 $SITE/api/v1/saude >/dev/null && return 0; sleep 1; done
  echo "o servidor local não subiu"; tail -20 /tmp/e2e-worker.log; exit 1
}

verificar() { # $1 = título, resto = argumentos de fumaca.mjs
  local titulo="$1"; shift
  echo "== $titulo"
  node $FUMACA "$@" || FALHAS=$((FALHAS + 1))
}

CHAVES="--var SUPABASE_SERVICE_ROLE_KEY:sb_secret_teste --var STAFF_BOOTSTRAP_EMAIL:gestor@exemplo.com"
TELAS="/dashboard,/dashboard?aba=aulas,/dashboard?aba=treinos,/dashboard?aba=captacao,/dashboard?aba=catraca,/dashboard?aba=seguranca,/vinculos,/dados-pessoais,/interessados,/integracoes,/financeiro,/aulas,/termos,/planos,/prescricao-treinos,/registrar-avaliacao,/formularios-mefe,/diagnostico"

subir "CHAVE_SECRETA=sb_secret_teste PAPEIS=staff" "$CHAVES"
verificar "equipe (gestão): todas as telas carregam" --rotas "$TELAS"

subir "CHAVE_SECRETA=sb_secret_teste" "$CHAVES"
verificar "primeira gestão: diagnóstico tudo certo e vínculos com o botão de ativar" --sem-aal2 \
  --rotas "/diagnostico" --espera "Tudo certo com a configuração"
verificar "primeira gestão: botão de ativar" --sem-aal2 --rotas "/vinculos" --espera "Ativar perfil da equipe"

subir "CHAVE_SECRETA=sb_secret_teste" "--var STAFF_BOOTSTRAP_EMAIL:gestor@exemplo.com"
verificar "sem a chave secreta no servidor" --sem-aal2 --rotas "/diagnostico" \
  --espera "SUPABASE_SERVICE_ROLE_KEY não está definida"
verificar "sem a chave secreta: vínculos explica o motivo" --sem-aal2 --rotas "/vinculos" \
  --espera "Abra /diagnostico para ver o que falta"

subir "CHAVE_SECRETA=sb_secret_teste" "--var SUPABASE_SERVICE_ROLE_KEY:sb_publishable_teste --var STAFF_BOOTSTRAP_EMAIL:gestor@exemplo.com"
verificar "chave pública colada no lugar da secreta" --sem-aal2 --rotas "/diagnostico" \
  --espera "contém a chave PÚBLICA;O Supabase recusou a chave"

subir "CHAVE_SECRETA=sb_secret_teste TABELAS_AUSENTES=registros_carga,lgpd_registros" "$CHAVES"
verificar "atualizações do banco faltando" --sem-aal2 --rotas "/diagnostico" \
  --espera "Faltam 2 tabela(s): lgpd_registros, registros_carga"

subir "CHAVE_SECRETA=sb_secret_teste" "--var SUPABASE_SERVICE_ROLE_KEY:sb_secret_teste"
verificar "sem STAFF_BOOTSTRAP_EMAIL" --sem-aal2 --rotas "/diagnostico" --espera "STAFF_BOOTSTRAP_EMAIL não está definida"

subir "CHAVE_SECRETA=sb_secret_teste" "--var SUPABASE_SERVICE_ROLE_KEY:sb_secret_teste --var STAFF_BOOTSTRAP_EMAIL:outra@pessoa.com"
verificar "e-mail autorizado diferente do da conta" --sem-aal2 --rotas "/diagnostico" --espera "é diferente do e-mail desta conta"

echo
if [ "$FALHAS" -eq 0 ]; then echo "E2E: TUDO CERTO"; else echo "E2E: $FALHAS verificação(ões) com falha"; exit 1; fi
