# Academia Family Gym

Aplicação web da Academia Family Gym, com três frentes no mesmo projeto:

- **Site público**: início, modalidades e valores (`/`, `/modalidades`, `/valores`).
- **Área do aluno** (`/app`): treinos, aulas e reservas, avaliações, resultados, plano e mensalidades, perfil e segurança (verificação em duas etapas).
- **Painel da equipe** (perfil `staff`): dashboard, alunos e vínculos com contas de acesso, termos, planos, aulas e presenças, financeiro, prescrição de treinos e registro de avaliações.

O projeto nasceu no [Lovable](https://lovable.dev) (editor do projeto: <https://lovable.dev/projects/daeb8427-631f-465e-becb-3230320eb0d8>; app publicado: <https://familygym-healthhub.lovable.app>) e este repositório é a fonte do código. Ele também roda fora do Lovable, seguindo este guia.

## Stack

- [TanStack Start](https://tanstack.com/start) + TanStack Router, React 19 e TypeScript estrito (Vite 8, Nitro)
- Tailwind CSS v4, Radix UI (shadcn/ui), Recharts
- [Supabase](https://supabase.com): Postgres com RLS, Auth (e-mail e senha, TOTP) e a API de dados
- Cloudflare Workers como destino de deploy (preset `cloudflare-module` do Nitro)
- Vitest para os testes de lógica

## Requisitos

- **Node.js 22.12 ou mais novo** (exigido pelo TanStack Start e pelo Vitest)
- **[Bun](https://bun.sh)** como gerenciador de pacotes. O repositório tem `bun.lock` e o `bunfig.toml` ignora versões publicadas há menos de 24 h (proteção contra pacotes comprometidos); `npm` não respeita isso e criaria um `package-lock.json` duplicado.
- Um projeto Supabase (o do Lovable Cloud ou um seu)
- Opcionais: [Supabase CLI](https://supabase.com/docs/guides/cli) para aplicar migrations e `psql` para rodar a verificação do banco

## Como rodar

```sh
bun install
cp .env.example .env.local   # preencha as variáveis (tabela abaixo)
bun run dev                  # http://localhost:8080
```

| Comando             | O que faz                                                      |
| ------------------- | -------------------------------------------------------------- |
| `bun run dev`       | servidor de desenvolvimento (porta 8080)                       |
| `bun run build`     | build de produção em `.output/` (Cloudflare Workers via Nitro) |
| `bun run build:dev` | build em modo desenvolvimento                                  |
| `bun run preview`   | serve o build localmente                                       |
| `bun run typecheck` | `tsc --noEmit`                                                 |
| `bun run lint`      | ESLint (com Prettier)                                          |
| `bun run format`    | Prettier em todo o projeto                                     |
| `bun run test`      | Vitest (`src/**/*.test.ts`, ambiente Node, só lógica pura)     |

## Variáveis de ambiente

O `.env.example` lista todas, sem valores. Há dois momentos diferentes:

- **Build** (`bun run build`): as `VITE_*` são embutidas no JavaScript do navegador. Só valores públicos.
- **Runtime do servidor** (Worker ou Node): lidas de `process.env` a cada requisição.

| Variável                        | Quando  | Obrigatória | Secreta | Para que serve                                                                                                                                                                                   |
| ------------------------------- | ------- | ----------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`             | build   | sim         | não     | URL do projeto Supabase usada pelo navegador. O servidor a usa como reserva se `SUPABASE_URL` faltar.                                                                                            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | build   | sim         | não     | Chave pública (`anon`/`publishable`). Acesso sempre limitado pelo RLS. Reserva do servidor se `SUPABASE_PUBLISHABLE_KEY` faltar.                                                                 |
| `VITE_SITE_URL`                 | build   | não         | não     | Endereço público do site, sem barra final. Torna absolutas as tags `og:image`, `og:url` e `rel=canonical` (as redes sociais ignoram URL relativa). Sem ela, só `og:image` é emitida, e relativa. |
| `SUPABASE_URL`                  | runtime | não         | não     | Substitui `VITE_SUPABASE_URL` no servidor.                                                                                                                                                       |
| `SUPABASE_PUBLISHABLE_KEY`      | runtime | não         | não     | Substitui `VITE_SUPABASE_PUBLISHABLE_KEY` no servidor.                                                                                                                                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | runtime | **sim**     | **sim** | Chave de serviço: ignora o RLS e dá acesso total ao banco. Só no servidor; usada em vínculos de conta e na ativação do primeiro staff.                                                           |
| `STAFF_BOOTSTRAP_EMAIL`         | runtime | não         | não     | E-mail confirmado autorizado a ativar o perfil da equipe na tela de vínculos, e só enquanto não existir nenhum staff.                                                                            |

Nunca coloque a `SUPABASE_SERVICE_ROLE_KEY` em arquivo versionado nem em variável `VITE_*` (seria publicada no navegador). Arquivos `*.local` já estão no `.gitignore`.

## Banco de dados

### Fonte da verdade

O esquema inteiro vive em **`supabase/migrations/`**. Aplicar toda a cadeia em um banco vazio reproduz as tabelas e colunas que o código usa (`src/integrations/supabase/types.ts`). Cada arquivo roda uma vez, em ordem de nome:

| Migration                                                  | O que faz                                                                                                                                                                                            |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `20260805160135_…` a `20260811172706_…`                    | Esquema original do Lovable: `alunos`, `avaliacoes`, `check_ins`, `assinaturas_relatorio`, `user_roles`, funções `private.*` e RLS. A primeira também insere 8 alunos de demonstração (veja abaixo). |
| `20260812000000_executar_funcoes_private.sql`              | Dá `EXECUTE` em `private.has_role` e `private.is_meu_aluno` a `authenticated`. Sem isso toda consulta de usuário logado falha com `permission denied for function has_role`.                         |
| `20260812000100_private_meu_aluno_id.sql`                  | Função de apoio às policies (avalia uma vez por consulta, em vez de uma vez por linha).                                                                                                              |
| `20260908113916_…`, `20260909093918_…`, `20260911141941_…` | Cópias idempotentes de `drizzle/migrations/0000` a `0002`: `alunos.turno` e `termo_valido_ate`, `pagamentos`, `aulas` e `aula_presencas`.                                                            |
| `20261004000000_modulos_area_do_aluno.sql`                 | Treinos, reservas de aula (com regra de lotação no banco), metas, medidas corporais e contato do aluno.                                                                                              |
| `20261004120000_vinculos_atomicos_e_bootstrap_staff.sql`   | Funções chamadas só pelo servidor: vínculos em lote e ativação do primeiro staff.                                                                                                                    |
| `20261004130000_…` a `20261004130300_…`                    | Policies otimizadas, chaves estrangeiras para `auth.users`, restrições de domínio, `updated_at` automático e limpeza de índice.                                                                      |
| `20261010000000_salvar_aula.sql`                           | Função `salvar_aula`: grava a aula e a lista de presenças numa única transação (nada se perde se um passo falhar). Chamada pelo servidor com o token de quem salva (RLS vale).                       |

As cópias do Drizzle têm timestamp **entre** `20260811172706` e `20261004000000` porque a migration de 2026-10-04 altera `public.aulas`. Elas são idempotentes (`IF NOT EXISTS`, `DROP POLICY IF EXISTS` antes de cada `CREATE POLICY`, carga inicial de `termo_valido_ate` só quando a coluna é criada), então rodam sem efeito no banco do Lovable, que já tem esses objetos.

Regras para mudar o esquema:

- Nunca edite uma migration já aplicada em algum banco. Crie uma nova, de preferência idempotente.
- Toda tabela nova precisa de RLS e de `GRANT` explícito. O app chama funções de `private.*` nas policies, então dê `EXECUTE` a `authenticated` em qualquer função nova desse schema usada em policy (o schema `private` continua sem `USAGE` e fora da API).

### Aplicar as migrations

Com a Supabase CLI, no projeto remoto (ex.: um projeto novo):

```sh
supabase login
supabase link --project-ref <ref-do-projeto>   # ou troque project_id em supabase/config.toml
supabase db push
```

Em um banco que já tem os objetos do Drizzle (como o do Lovable), o mesmo `supabase db push` serve: as migrations novas têm timestamp maior que o da última migration original (`20260811172706`) e as cópias do Drizzle são idempotentes, então não alteram o que já existe. Para um Supabase local (Docker): `supabase start` e `supabase db reset`.

Sem a CLI, abra cada arquivo de `supabase/migrations/` no **SQL Editor** do Supabase, na ordem do nome, e execute.

Depois de aplicar, confira no SQL Editor:

```sql
select has_function_privilege('authenticated', 'private.has_role(uuid, public.app_role)', 'execute');   -- true
select conname from pg_constraint
where connamespace = 'public'::regnamespace and conname like '%\_chk';   -- 11 restrições de domínio
```

A migration `20261004130200_restricoes_de_dominio.sql` só cria cada restrição se nenhuma linha existente a violar; se alguma linha legada violar, ela emite um `WARNING` com o nome da restrição e segue. Corrija as linhas apontadas e rode de novo o bloco `DO` do arquivo (SQL Editor ou `psql -f`; é idempotente).

### O papel da pasta `drizzle/`

`drizzle/` é **legado do Lovable**. O Lovable aplicava `drizzle/migrations/0000` a `0002` no banco dele com o `drizzle-kit` (por isso o `drizzle.config.ts` lê `LOVABLE_DB_MIGRATION_URL`); `drizzle/schema.ts` está em branco de propósito e os snapshots em `meta/` não descrevem tabelas. Nada disso é fonte de verdade: o esquema completo está em `supabase/migrations/`, que já inclui as três migrations do Drizzle. Não apague a pasta (o Lovable pode continuar usando) e não rode `drizzle-kit generate` aqui. Se o Lovable gerar um `0003` novo, copie-o para `supabase/migrations/` com um timestamp na ordem certa e idempotente, como foi feito com os três primeiros.

### Dados de demonstração da primeira migration

`20260805160135_…` insere 8 alunos fictícios (e-mails `@email.com`), com avaliações e check-ins de julho de 2026. Todo banco novo nasce com eles. Antes de operar com alunos reais, apague-os (remove também avaliações, check-ins, pagamentos e reservas ligados, por `ON DELETE CASCADE`):

```sql
-- Confira antes: deve listar só os 8 alunos fictícios.
select nome, email from public.alunos where email in (
  'ana.ribeiro@email.com', 'carlos.menezes@email.com', 'duarte.familia@email.com', 'bia.lima@email.com',
  'joaquim.alves@email.com', 'marina.souza@email.com', 'pedro.nogueira@email.com', 'luisa.campos@email.com');

delete from public.alunos where email in (
  'ana.ribeiro@email.com', 'carlos.menezes@email.com', 'duarte.familia@email.com', 'bia.lima@email.com',
  'joaquim.alves@email.com', 'marina.souza@email.com', 'pedro.nogueira@email.com', 'luisa.campos@email.com');
```

### Verificação do banco

`supabase/verificacao/` tem testes SQL de RLS, permissões e regras (reserva com lotação, validações, chaves estrangeiras, `updated_at`), um teste de duas sessões reservando a última vaga e a conferência de tabelas e colunas com o `types.ts`. Rode só em um banco **descartável**:

```sh
createdb teste
CONFIRMO_BANCO_DESCARTAVEL=sim DATABASE_URL=postgresql://postgres@localhost:5432/teste \
  supabase/verificacao/executar.sh --stubs --migrar --concorrencia --tipos
```

`--stubs` cria os papéis e o `auth.uid()` em um Postgres puro; em um Supabase local (depois de `supabase db reset`) omita `--stubs` e `--migrar`.

## Autenticação (Supabase Auth)

O app envia `emailRedirectTo = <origem>/auth` no cadastro e no reenvio da confirmação e `redirectTo = <origem>/reset-password` na recuperação de senha. Se essas URLs não estiverem autorizadas, o Supabase as troca pelo **Site URL** e os links dos e-mails levam ao lugar errado.

No painel do Supabase, em **Authentication > URL Configuration**:

- **Site URL**: o endereço de produção (ex.: `https://familygym-healthhub.lovable.app`).
- **Redirect URLs**: `https://<dominio>/auth`, `https://<dominio>/reset-password` e, para desenvolvimento, `http://localhost:8080/auth` e `http://localhost:8080/reset-password`.

Também confira **Confirm email** ligado (o app pede o e-mail confirmado para entrar, para vincular aluno e para ativar o primeiro staff) e a **verificação em duas etapas (TOTP)** habilitada (a tela de Segurança usa fatores TOTP).

O `supabase/config.toml` declara essa mesma configuração (`[auth]`, `[auth.email]`, `[auth.mfa.totp]`) para a Supabase CLI. Atenção: `supabase config push` grava o arquivo no projeto remoto; troque o domínio e o `project_id` pelos do seu projeto e revise o diff antes de confirmar.

## Primeiro usuário da equipe (staff)

O perfil `staff` vive na tabela `user_roles` e libera o painel da equipe e a escrita nas tabelas de gestão. Para criar o primeiro:

1. Crie a conta pela tela `/auth` do app (cadastro) e confirme o e-mail.
2. No **SQL Editor** do Supabase (ou `psql`), conceda o papel:

```sql
insert into public.user_roles (user_id, role)
select id, 'staff'
from auth.users
where lower(email) = lower('equipe@suaacademia.com.br')   -- troque pelo e-mail da conta
  and email_confirmed_at is not null
on conflict (user_id, role) do nothing;
```

3. Saia e entre de novo. Os demais staff e os vínculos aluno x conta são feitos depois pela tela `/vinculos`, já como staff.

Alternativa sem SQL: defina `STAFF_BOOTSTRAP_EMAIL` no servidor com o e-mail da conta; enquanto não existir nenhum staff, essa conta (com e-mail confirmado) vê na tela de vínculos o botão para ativar o perfil da equipe.

## Deploy no Cloudflare Workers

O build gera o Worker em `.output/` (preset `cloudflare-module` do Nitro, com `nodejs_compat`) e um `.wrangler/deploy/config.json` que aponta para `.output/server/wrangler.json`.

1. **Build** com as variáveis públicas no ambiente (CI ou terminal):

   ```sh
   VITE_SUPABASE_URL=https://<ref>.supabase.co \
   VITE_SUPABASE_PUBLISHABLE_KEY=<chave-publica> \
   bun run build
   ```

2. **Segredos do Worker** (valem para qualquer deploy seguinte; o `wrangler.json` é regerado a cada build, então não guarde variáveis nele):

   ```sh
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name <nome-do-worker>
   npx wrangler secret put STAFF_BOOTSTRAP_EMAIL --name <nome-do-worker>   # opcional
   ```

   O nome do Worker está em `.output/server/wrangler.json` (campo `name`). Variáveis que não são secretas podem ir no próprio deploy (`npx wrangler deploy --var NOME:valor`). Se preferir cadastrá-las no painel da Cloudflare (Workers > Settings > Variables and Secrets), faça o deploy com `--keep-vars` para o `wrangler deploy` não removê-las.

3. **Deploy**, na raiz do projeto, depois do build:

   ```sh
   npx wrangler deploy
   ```

`SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no Worker são opcionais: sem elas o servidor usa as `VITE_*` embutidas no build.

> O passo a passo do deploy segue o que o build gera neste repositório, mas não foi executado de ponta a ponta (exige credenciais da Cloudflare).

## Modo demonstração

`/app?demo=1` abre a área do aluno com dados de exemplo, sem login e sem acessar o banco. O modo fica ativo na aba (`sessionStorage`) até clicar em **Sair da demonstração**. Serve para apresentar o produto sem expor dados reais.

## Testes

```sh
bun run test        # Vitest: lógica pura em src/**/*.test.ts
bun run typecheck
bun run lint
```

Os testes do banco (RLS, permissões, regras de reserva) estão em `supabase/verificacao/` e rodam à parte, como descrito acima.

## Segurança em resumo

- Todas as tabelas têm RLS: o aluno enxerga só o que é dele e a equipe (`staff`) gerencia tudo. As policies chamam funções do schema `private`, fora da API do PostgREST.
- O navegador só usa a chave pública. A chave de serviço existe apenas no servidor e nunca é embutida no build.
- Regras que não podem depender do navegador (lotação das aulas, validação de check-ins, data do treino) são impostas no banco.
- Não versione `.env` com segredos. O `.env.example` mostra o formato sem valores.
