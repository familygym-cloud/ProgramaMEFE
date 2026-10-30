# Publicar e testar o site — passo a passo

Tempo estimado: 1 a 2 horas na primeira vez. Tudo abaixo funciona nos planos gratuitos de Supabase e
Cloudflare (suficiente para testar). Você só precisa de e-mail e navegador.

## O que você vai usar

| Peça                | Para quê               | Endereço                                   |
| ------------------- | ---------------------- | ------------------------------------------ |
| **Supabase**        | Banco de dados e login | <https://supabase.com>                     |
| **Cloudflare**      | Coloca o site no ar    | <https://dash.cloudflare.com>              |
| **GitHub** (já tem) | Guarda o código        | repositório `familygym-cloud/ProgramaMEFE` |

## Passo 1 — Supabase (banco e login)

1. Entre em supabase.com, crie a conta e clique em **New project**. Nome: `familygym`. Região:
   **South America (São Paulo)**. Crie uma senha forte para o banco e **guarde-a** num gerenciador de senhas.
2. Quando o projeto abrir, vá em **Project Settings > API** e anote (não compartilhe em público):
   - **Project URL** (algo como `https://abcd1234.supabase.co`);
   - **Publishable key** (ou "anon"): chave pública;
   - **Secret key** (ou "service_role"): chave secreta. **Nunca** coloque em lugar público.
3. Vá em **SQL Editor > New query**. Abra o arquivo `supabase/publicar/1-banco-parte-1.sql` do repositório,
   copie **todo** o conteúdo, cole e clique em **Run**. Deve terminar sem erro vermelho.
4. Nova consulta: faça o mesmo com `supabase/publicar/2-banco-parte-2.sql` (**depois** da parte 1).
5. Valores reais dos planos: nova consulta, cole o arquivo privado `precos-reais.sql` (que enviei a você
   separado) e rode. Esses valores ficam só no banco, nunca no site público.
6. **Authentication > Sign In / Providers > Multi-Factor**: confirme que TOTP está ligado.
7. Deixe **Authentication > URL Configuration** para o passo 3 (precisa do endereço do site).

> **Já publicou antes e saiu uma novidade no banco?** Não rode as partes 1 e 2 de novo. Abra a pasta
> `supabase/publicar/atualizacoes/`, cole no SQL Editor só o arquivo novo (um por novidade; todos podem
> rodar mais de uma vez sem estragar nada) e clique em **Run**. Hoje há um: `20261011000700_registros_carga.sql`
> (carga por exercício e recordes do aluno). Sem ele o site funciona, mas essa parte aparece como "ainda não ativada".

> Se preferir usar a Supabase CLI: `supabase link` e `supabase db push` aplicam as migrations na ordem
> certa e dispensam os passos 3 e 4.

## Passo 2 — Cloudflare (colocar no ar)

Escolha **uma** das duas formas.

### Forma A — pelo painel, conectando o GitHub (sem terminal)

1. Entre em dash.cloudflare.com e crie a conta.
2. **Workers & Pages > Create > Import a repository**. Autorize o GitHub e escolha
   `familygym-cloud/ProgramaMEFE`, branch **main** (antes, o pull request com as novidades precisa estar
   aceito em `main`).
3. Nome do projeto: **familygym** (precisa ser exatamente este).
4. Comandos:
   - **Build command:** `bun install --frozen-lockfile && bun run build`
   - **Deploy command:** `npx wrangler deploy`
5. **Variables** do build (públicas):
   - `VITE_SUPABASE_URL` = Project URL do passo 1
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = chave pública do passo 1
6. Salve e deixe construir. Quando terminar, a Cloudflare mostra o endereço
   `https://familygym.<seu-usuario>.workers.dev`.
7. Em **familygym > Settings > Variables and Secrets**, adicione como **Secret**:
   - `SUPABASE_SERVICE_ROLE_KEY` = chave secreta do passo 1
   - `STAFF_BOOTSTRAP_EMAIL` = o e-mail de quem será o primeiro gestor
     Depois, em **Deployments**, faça um novo deploy para valer as variáveis.

> Esta forma segue o que o projeto gera (`wrangler deploy` lê a configuração criada pelo build), mas eu
> não pude testá-la de ponta a ponta daqui. Se falhar, copie a mensagem de erro do build e me envie.

### Forma B — pelo computador (terminal)

Precisa de Node 22+ e Bun instalados.

```sh
git clone https://github.com/familygym-cloud/ProgramaMEFE.git
cd ProgramaMEFE
git checkout main            # ou a branch com as novidades
bun install
cp .env.example .env.local   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
npx wrangler login           # abre o navegador para autorizar a Cloudflare
bun run deploy               # constrói e publica
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name familygym
npx wrangler secret put STAFF_BOOTSTRAP_EMAIL --name familygym
```

## Passo 3 — Ligar o site ao login

Com o endereço do site em mãos (`https://familygym.<seu-usuario>.workers.dev`):

1. **Cloudflare:** adicione a variável do build `VITE_SITE_URL` com esse endereço (sem barra no fim) e
   faça novo deploy. Ela alimenta o mapa do site, o canonical e as pré-visualizações de compartilhamento.
2. **Supabase > Authentication > URL Configuration:**
   - **Site URL:** o endereço do site;
   - **Redirect URLs:** `https://<endereço>/auth` e `https://<endereço>/reset-password`.
3. **E-mail:** o e-mail padrão do Supabase só entrega a pessoas da **equipe do projeto** e limita a cerca de
   2 por hora. Para o primeiro teste use o seu próprio e-mail (convide-o em **Supabase > Organization >
   Team**). Antes de abrir ao público, configure um SMTP próprio (veja `docs/configuracao-de-producao.md`)
   e cole os modelos em português de `supabase/email-templates/`.

## Passo 4 — Primeiro gestor

1. Abra o site, vá em **Entrar > Criar conta** e cadastre o e-mail que você pôs em `STAFF_BOOTSTRAP_EMAIL`.
2. Confirme o e-mail pelo link que chegar.
3. Entre e abra `/vinculos`: aparece o botão para **ativar o perfil da equipe**. Clique.
4. O site leva você à tela de **Segurança** para cadastrar o aplicativo autenticador (Google
   Authenticator, Authy, etc.): escaneie o QR e digite o código. Isso é obrigatório para a equipe.
5. Saia e entre de novo (agora pedindo o código). Você chega no painel da gestão.
6. Em `/vinculos > Perfis da equipe`, defina **Recepção** e **Professor** para as outras pessoas (cada
   uma cria a conta e confirma o e-mail antes).
7. Quando terminar, **apague** a variável `STAFF_BOOTSTRAP_EMAIL` na Cloudflare.

## Passo 4b — Cadastrar os alunos

Com a gestão ativa, abra **Alunos** (`/alunos`) e cadastre o primeiro aluno ou **importe a planilha** que a academia já
tem (veja `docs/cadastro-de-alunos.md`). Peça aos alunos para criar o acesso em `/auth` com o mesmo e-mail da ficha:
a conta se liga sozinha.

## Passo 5 — Roteiro de testes

Marque cada item. Anote o que falhar (com captura de tela) e me envie.

**Site público (sem login)**

- [ ] A página inicial abre no celular e no computador, com logo e cores certas.
- [ ] Grade, Modalidades, Programa MEFE, Privacidade e Termos de uso abrem.
- [ ] "Como chegar" abre o Maps/Waze; "Fale conosco" abre o WhatsApp da recepção.
- [ ] `/valores` **não mostra preços**.
- [ ] `/comece`: envie um pedido de teste; ele aparece em **Interessados** no painel.
- [ ] `/robots.txt` e `/sitemap.xml` abrem.

**Aluno**

- [ ] Criar conta, receber o e-mail, confirmar e entrar.
- [ ] Sem ficha, a conta mostra a tela de "ainda não vinculada". Crie uma ficha de aluno com o mesmo e-mail
      (no banco ou pela equipe) e confira o **vínculo automático** ao entrar de novo.
- [ ] Reservar uma aula, cancelar, e entrar na **lista de espera** de uma aula lotada.
- [ ] Ver treinos, avaliações (e a comparação), resultados e plano com valores.
- [ ] **Pix:** "Pagar com Pix" gera o código; pague **R$ 1,00** de teste e confira, no app do seu banco, se o
      nome do recebedor aparece correto. Depois a recepção dá baixa na parcela.
- [ ] No celular: **instalar o app** (Perfil > App no celular) e abrir o treino do dia sem internet.

**Equipe**

- [ ] Recepção: vê vínculos, financeiro e aulas, e **não** vê avaliações físicas nem treinos.
- [ ] Professor: vê treinos e avaliações, e **não** vê financeiro.
- [ ] Gestão: abre relatórios, perfis da equipe e **Integrações**.
- [ ] Financeiro: botão **Lembrar** abre o WhatsApp com a cobrança pronta.

**Integração (catraca)**

- [ ] Em **Integrações**, crie uma chave com `acessos:escrever` e `acessos:ler`. No terminal:

```sh
curl https://<endereço>/api/v1/saude
curl -X POST https://<endereço>/api/v1/acessos \
  -H "Authorization: Bearer fgk_..." -H "Content-Type: application/json" \
  -d '{"email":"aluno@exemplo.com"}'
```

## Se algo der errado

| Sintoma                                          | Causa provável                                                                                                                                                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site abre em branco ou "configuração incompleta" | `VITE_SUPABASE_*` ausentes no **build**: ajuste e refaça o deploy.                                                                                                                                                                      |
| Login funciona mas o painel dá erro              | `SUPABASE_SERVICE_ROLE_KEY` ausente no Worker (Secret).                                                                                                                                                                                 |
| Não consigo ativar a gestão / "Não foi possível" | Entre no site e abra **/diagnostico**: ele confere as chaves, o banco e o e-mail da gestão e diz o que ajustar, item por item. Use **Copiar resumo para suporte** para me mandar o resultado (não tem nenhuma chave).                   |
| E-mail de confirmação não chega                  | Limite do e-mail padrão do Supabase; configure SMTP próprio.                                                                                                                                                                            |
| Link do e-mail leva ao lugar errado              | Site URL / Redirect URLs do Supabase não conferem (passo 3).                                                                                                                                                                            |
| "Fonte New Order" não aparece                    | O arquivo da fonte é licenciado e **não está no repositório**; o site usa a Urbanist no lugar. Para usar a New Order, o arquivo `public/fonts/NewOrder-Regular.otf` precisa entrar no build (repositório privado e licença confirmada). |
| Erro ao rodar o SQL                              | Rodou a parte 2 antes da 1, ou rodou uma parte duas vezes.                                                                                                                                                                              |

Primeiro passo para qualquer problema de configuração: abra **/diagnostico** (basta estar logado).

Logs: Cloudflare **Workers & Pages > familygym > Logs** e Supabase **Logs**.

## Depois dos testes

Domínio próprio, SMTP definitivo, repositório privado, backups e monitoramento: veja
`docs/configuracao-de-producao.md`.
