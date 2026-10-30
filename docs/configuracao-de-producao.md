# Configuração de produção (Supabase)

Faça uma vez, antes de abrir o cadastro ao público. Tudo é no painel do Supabase
(<https://supabase.com/dashboard>, projeto da Family Gym).

## 1. E-mail próprio (SMTP) — obrigatório

O e-mail padrão do Supabase só entrega a membros da equipe do projeto e limita a cerca de 2 e-mails por
hora. Sem SMTP próprio, os clientes **não recebem** o e-mail de confirmação.

1. Crie conta em um provedor de e-mail transacional (Resend, Brevo, Amazon SES, SendGrid...) e verifique o
   domínio da academia (registros SPF e DKIM que o provedor mostra).
2. **Authentication > Emails > SMTP Settings**: ative **Enable custom SMTP** e preencha host, porta
   (587), usuário, senha, e-mail do remetente (ex.: `nao-responda@seudominio.com.br`) e nome
   (`Academia Family Gym`).
3. **Authentication > Emails > Templates**: cole os modelos em português de `supabase/email-templates/`
   (passo a passo em `supabase/email-templates/LEIA-ME.md`).
4. Teste: crie uma conta com um e-mail seu e confira a caixa de entrada e o spam.

## 2. Endereços do site

**Authentication > URL Configuration**: **Site URL** com o endereço do site publicado, e em **Redirect URLs**
`https://<dominio>/auth` e `https://<dominio>/reset-password`.

## 3. Verificação em duas etapas (TOTP)

**Authentication > Sign In / Providers > Multi-Factor**: TOTP ligado (enroll e verify).

Regra do sistema: **toda conta da equipe (gestão, recepção, professor) só abre as ferramentas depois de
cadastrar o aplicativo autenticador e entrar com o código.** O app leva a pessoa à tela de Segurança no
primeiro acesso e o banco também recusa dados da equipe em sessão sem o código. Alunos podem ativar se
quiserem.

Em emergência (por exemplo, perda do aparelho da única conta de gestão), rode no SQL Editor:

```sql
UPDATE private.configuracoes SET valor = 'false' WHERE chave = 'exigir_mfa_equipe';
-- depois que a equipe cadastrar os aparelhos, volte para 'true'
```

## 4. Primeiro acesso da equipe

1. Defina `STAFF_BOOTSTRAP_EMAIL` (segredo do Worker) com o e-mail da pessoa de gestão.
2. Essa pessoa cria a conta no site, confirma o e-mail e abre **/vinculos**: aparece o botão para ativar o
   perfil de gestão (só funciona enquanto não existir nenhuma gestão).
3. Ela cadastra o aplicativo autenticador (o app leva à tela de Segurança).
4. Em **/vinculos > Perfis da equipe**, define **Recepção** e **Professor** para as demais contas (cada
   pessoa cria a conta e confirma o e-mail antes).
5. Remova `STAFF_BOOTSTRAP_EMAIL` do Worker.

| Perfil    | Pode usar                                                                               | Não vê                                      |
| --------- | --------------------------------------------------------------------------------------- | ------------------------------------------- |
| Gestão    | Tudo, inclusive relatórios e perfis da equipe                                           | —                                           |
| Recepção  | Cadastro de alunos, vínculos, termos, financeiro, valores dos planos, aulas e presenças | Avaliações físicas, medidas, metas, treinos |
| Professor | Treinos, avaliações físicas, medidas, metas, aulas e presenças; alunos somente leitura  | Financeiro, valores dos planos, vínculos    |

Observação: as "observações" da ficha do aluno ficam na tabela de alunos e são visíveis à recepção e ao
professor. Não grave ali informação clínica detalhada.

## 5. Vínculo automático de alunos

Quando um aluno cria a conta e confirma o e-mail, o sistema liga a conta à ficha **somente se** o e-mail
confirmado for igual ao e-mail de **uma única** ficha ainda sem conta. Se houver zero ou mais de uma ficha
com aquele e-mail, nada é ligado e a recepção vincula em **/vinculos**. Para desligar: defina
`VINCULO_AUTOMATICO=desligado` no Worker. **Confira os e-mails das fichas**: um e-mail errado na ficha
liga a pessoa errada.

## 6. Fichas de demonstração

A migration `20261011000200` apaga as 8 fichas de demonstração (nome e e-mail `@email.com` exatamente
iguais aos da primeira migration, e só se nunca foram ligadas a uma conta).

## 7. Recursos do aluno que dependem de configuração

- **Pix copia e cola da mensalidade**: a chave padrão é o CNPJ da Family Gym (`63.973.843/0001-94`, em
  `src/lib/pix.ts`). Para trocar, defina `VITE_PIX_CHAVE` (e, se quiser, `VITE_PIX_NOME` e
  `VITE_PIX_CIDADE`) antes do build. CNPJ com dígito errado desliga o botão. A baixa da
  parcela continua sendo feita pela recepção (o app não confirma pagamento sozinho).
- **Lista de espera nas aulas**: vem da migration `20261011000300_lista_de_espera.sql`. Quando uma vaga
  abre (cancelamento, remoção da reserva ou aumento de vagas), o primeiro da fila entra sozinho. O aluno
  vê o aviso na tela inicial; não há e-mail nem WhatsApp automático.
- **App instalável e treino offline**: o service worker (`public/sw.js`) só é registrado no site
  publicado. O treino salvo no aparelho é apagado ao sair da conta.

## 8. Pedidos de matrícula pelo site (interessados)

O formulário público fica em `/comece` ("Quero me matricular", "Quero conhecer a academia", "Tenho uma
dúvida"). Os pedidos caem na tela **Interessados** (`/interessados`, gestão e recepção), com botão de
WhatsApp já com a mensagem pronta, situação (novo, contatado, matriculado, descartado) e anotação. Vem
da migration `20261011000500_interessados.sql`.

- O pedido guarda a concordância da pessoa com o contato (data e hora). Quem preenche não precisa de conta.
- Pedido repetido (mesmo telefone e mesmo tipo em 24 horas) não cria outro registro.
- Proteções: campo-isca contra robôs e limite de 300 pedidos por hora. Para reforçar, ative o Cloudflare
  Turnstile no formulário (próxima etapa).
- Dado pessoal: apague os pedidos antigos conforme a política de retenção da academia.

## 9. Segurança das respostas e limites

- **Cabeçalhos de segurança** em todas as respostas (`src/lib/cabecalhos-seguranca.ts`): bloqueio de frames
  de terceiros, `nosniff`, HTTPS obrigatório (HSTS), política de referrer e permissões do navegador.
  A política de scripts (CSP completa) ficou de fora porque o servidor injeta scripts em linha; ativar
  exigiria nonces e testes em todas as telas.
- **Limite de uso** na memória do servidor (`src/lib/limite-de-uso.ts`): 5 pedidos a cada 10 minutos por
  endereço no formulário `/comece`; 120 chamadas por minuto por chave e 40 por endereço na API. É
  proteção básica: para um teto global, crie uma regra em _Security > WAF > Rate limiting rules_ na
  Cloudflare para `/api/*` e `/comece`.
- **Dados pessoais (LGPD)**: a tela `/dados-pessoais` (só gestão) exporta, anonimiza ou exclui os dados de
  um aluno e remove a conta de login. Cada ação fica registrada sem dado pessoal.

## 10. Relatórios da operação e cargas por exercício

- **Central de relatórios** (`/dashboard`, só gestão): além de Visão geral, Financeiro, Frequência, Saúde, Termos
  e Alunos, há cinco abas novas, todas com exportação CSV e impressão:
  - **Aulas**: ocupação, presença, cancelamentos, lista de espera, desempenho por modalidade, horário e professor,
    e a lotação das próximas aulas;
  - **Treinos**: alunos com e sem ficha, exercícios e grupos musculares mais prescritos, cargas registradas e recordes;
  - **Captação**: funil dos pedidos do formulário do site, conversão em matrícula e pedidos sem resposta;
  - **Catraca e API**: acessos por hora e dia da semana, alunos que passaram na catraca, uso da API, taxa de erro e chaves paradas;
  - **Equipe e LGPD**: pessoas por perfil e pedidos de dados pessoais atendidos.
    A **Visão geral** traz o "Panorama da operação" com um número de cada área e atalhos.
- As abas novas buscam os dados quando abertas (`carregarRelatorioOperacao`, só gestão, com a chave de serviço).
  Uma parte cuja atualização do banco ainda não foi aplicada aparece como "ainda não ativada", sem derrubar o resto.
- A demonstração pública `/equipe-demo` mostra todas as abas com dados fictícios.
- **Cargas por exercício** (migration `20261011000700_registros_carga.sql`): ao concluir o treino o aluno informa a
  carga e as repetições usadas; o app calcula o recorde pela carga estimada para 1 repetição (fórmula de Epley) e
  mostra a evolução em **Resultados > Cargas**. Professores e gestão leem os registros; recepção não. A exportação e a
  anonimização/exclusão da LGPD já incluem as cargas.

## 11. Diagnóstico e teste de ponta a ponta

- **/diagnostico** (qualquer conta logada): confere, sem nunca mostrar uma chave, se o endereço e as chaves do
  Supabase estão certos (a pública no lugar da pública, a secreta no lugar da secreta), se o Supabase aceita a
  chave secreta, se o banco tem todas as tabelas e perfis, se a função que ativa a gestão responde e se a conta
  atual pode virar gestão (`STAFF_BOOTSTRAP_EMAIL`). Cada item traz o que fazer, e o botão "Copiar resumo para
  suporte" gera um texto sem segredo. Limite de 6 consultas por minuto por conta.
- As telas de vínculos e do painel apontam para o diagnóstico quando algo de configuração falha, e a tradução
  dos erros do servidor (`src/lib/erros-servidor.ts`) reconhece chave recusada e tabela ausente.
- **Consultas HEAD** (`head: true` do supabase-js) não são usadas: numa requisição HEAD o servidor não devolve
  corpo, então um erro chega sem mensagem e uma tabela inexistente parece existir.
- **`bun run e2e`**: constrói o site apontando para um Supabase de mentira
  (`supabase/verificacao/e2e/supabase-falso.mjs`), sobe o servidor de produção local (`wrangler dev`) e abre todas as
  telas da equipe e o diagnóstico em cenários de configuração errada (sem chave secreta, chave pública colada no
  lugar da secreta, tabelas faltando, e-mail da gestão diferente). Precisa do Playwright (`npm i -g playwright`) e não
  toca em nenhum serviço real. Leva alguns minutos.

## 12. Financeiro: lançar e gerar mensalidades

- **/financeiro** (gestão e recepção): além da lista, da baixa, da reabertura e do lembrete por WhatsApp, a equipe
  **lança mensalidades** (uma ou várias parcelas para um aluno, ou uma cobrança avulsa como matrícula) e **gera as
  mensalidades do mês** para todos os alunos ativos, repetindo valor, forma de pagamento e dia do vencimento da última
  parcela de cada um. O guia completo, com as regras e os cuidados, está em `docs/financeiro.md`.
- **Correções**: parcelas em aberto podem ser editadas e excluídas (uma ou várias de uma vez, útil quando se gera o mês
  errado); parcela paga nunca é apagada, nem se alguém der baixa durante a exclusão. Não há "desfazer" nem histórico de
  exclusões no banco: o Worker registra no log só quem excluiu e quantas parcelas, sem dado pessoal.
- **Recibo** (`/recibo/<parcela>`): toda parcela paga tem recibo imprimível, com valor por extenso, CNPJ e endereço da
  academia (os mesmos do site; `VITE_CONTATO_ENDERECO` e `VITE_CONTATO_WHATSAPP` valem aqui também). O aluno abre os
  dele em **Meu plano**; a equipe do financeiro, no botão **Recibo** da lista. Não é nota fiscal.
- **Não precisa de atualização de banco**: usa a tabela `pagamentos` e a política que já dá acesso à gestão e à recepção.
- Os valores nunca vêm do site público nem da tabela de preços dos planos: são digitados pela equipe ou copiados da
  última parcela do aluno. Quem nunca foi cobrado recebe a primeira cobrança por **Lançar mensalidade**.
- Primeira vez: faça um lançamento de teste com um aluno de teste (1 parcela de R$ 1,00), confira na lista e em **Meu
  plano** do aluno e dê baixa; depois use **Gerar mensalidades do mês** com o mês seguinte para ver a prévia.
