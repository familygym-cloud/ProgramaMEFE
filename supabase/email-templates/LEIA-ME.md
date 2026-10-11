# Modelos de e-mail da Academia Family Gym (em português)

Por padrão, o Supabase envia os e-mails da área do aluno em **inglês** e sem a identidade da marca
("Confirm your email address"). Esta pasta tem os modelos prontos em português, com a identidade
Family Gym (Preto Onix, Amarelo Real e Cinza Alabastro, fonte Urbanist com reserva Arial).

Cada arquivo `.html` começa com um comentário `<!-- Assunto sugerido: ... -->`. O assunto **não** faz
parte do HTML: ele é colado em um campo separado do painel (veja as tabelas abaixo).

## Passo a passo no painel do Supabase (sem programar)

1. Entre em <https://supabase.com/dashboard> e abra o projeto da Family Gym.
2. No menu da esquerda, clique em **Authentication** (Autenticação) e depois em **Emails**
   (em versões antigas do painel: **Email Templates**).
3. Na aba **Templates**, escolha o tipo de e-mail da tabela abaixo.
4. No campo **Subject** (Assunto), apague o texto em inglês e cole o assunto da tabela.
5. No campo **Message body** (Corpo da mensagem), apague tudo, abra o arquivo `.html` correspondente
   desta pasta em um editor de texto (o Bloco de Notas serve), copie **todo** o conteúdo e cole.
6. Clique em **Save changes** (Salvar). Repita para os demais tipos.
7. Faça um teste: crie uma conta de teste na área do aluno e confira o e-mail recebido, inclusive no
   celular e na pasta de spam.

Não troque nem apague os trechos entre chaves duplas, como `{{ .ConfirmationURL }}`: são as
informações que o Supabase preenche sozinho (link de confirmação, e-mail da pessoa, código etc.).

### E-mails que a pessoa precisa responder

| Tipo no painel                        | Arquivo               | Assunto para colar                                 |
| ------------------------------------- | --------------------- | -------------------------------------------------- |
| Confirm signup (Confirmar cadastro)   | `confirmacao.html`    | Confirme seu e-mail na Academia Family Gym         |
| Invite user (Convidar usuário)        | `convite.html`        | Você foi convidado para a Academia Family Gym      |
| Magic link (Link mágico)              | `link-magico.html`    | Seu link de acesso à Academia Family Gym           |
| Change email address (Alterar e-mail) | `troca-email.html`    | Confirme a troca de e-mail da sua conta Family Gym |
| Reset password (Redefinir senha)      | `recuperacao.html`    | Redefina sua senha da Academia Family Gym          |
| Reauthentication (Reautenticação)     | `reautenticacao.html` | Seu código de confirmação Family Gym               |

### Avisos de segurança (somente informativos)

Estes avisos só aparecem nas versões recentes do painel (seção **Notifications** da página
**Emails**). Eles vêm desligados por padrão: ligue o botão de cada um e cole assunto e corpo.
Se a sua versão do painel não tiver essa seção, ignore esta tabela.

| Tipo no painel        | Arquivo                        | Assunto para colar                                  |
| --------------------- | ------------------------------ | --------------------------------------------------- |
| Password changed      | `senha-alterada.html`          | Sua senha da Family Gym foi alterada                |
| Email address changed | `email-alterado.html`          | O e-mail da sua conta Family Gym foi alterado       |
| Identity linked       | `identidade-vinculada.html`    | Uma nova forma de entrar foi adicionada à sua conta |
| Identity unlinked     | `identidade-desvinculada.html` | Uma forma de entrar foi removida da sua conta       |
| MFA method added      | `mfa-ativado.html`             | Verificação em duas etapas ativada na sua conta     |
| MFA method removed    | `mfa-removido.html`            | Verificação em duas etapas removida da sua conta    |

## Variáveis usadas nos modelos

| Variável                 | O que mostra                                       |
| ------------------------ | -------------------------------------------------- |
| `{{ .ConfirmationURL }}` | Link de confirmação (botão e link por extenso)     |
| `{{ .Token }}`           | Código de 6 dígitos (link mágico e reautenticação) |
| `{{ .Email }}`           | E-mail da conta                                    |
| `{{ .NewEmail }}`        | Novo e-mail, na troca de e-mail                    |
| `{{ .OldEmail }}`        | E-mail anterior, no aviso de e-mail alterado       |
| `{{ .SiteURL }}`         | Endereço do site, no rodapé                        |
| `{{ .Provider }}`        | Método de acesso vinculado ou removido             |
| `{{ .FactorType }}`      | Tipo da verificação em duas etapas                 |

`{{ .TokenHash }}` e `{{ .RedirectTo }}` também existem no Supabase, mas estes modelos não precisam deles:
o `{{ .ConfirmationURL }}` já leva o código e o endereço de retorno (`/auth` ou `/reset-password`).

## Quem usa o Supabase pela CLI: bloco para o `supabase/config.toml`

Se o projeto é configurado pelo arquivo (e não pelo painel), acrescente o bloco abaixo ao
`supabase/config.toml`. Os caminhos são relativos à raiz do repositório.
**Atenção:** `supabase config push` grava as configurações de `[auth]` no projeto remoto; confira antes
as demais chaves desse arquivo (veja o aviso no topo do próprio `config.toml`).

```toml
[auth.email.template.confirmation]
subject = "Confirme seu e-mail na Academia Family Gym"
content_path = "./supabase/email-templates/confirmacao.html"

[auth.email.template.invite]
subject = "Você foi convidado para a Academia Family Gym"
content_path = "./supabase/email-templates/convite.html"

[auth.email.template.magic_link]
subject = "Seu link de acesso à Academia Family Gym"
content_path = "./supabase/email-templates/link-magico.html"

[auth.email.template.email_change]
subject = "Confirme a troca de e-mail da sua conta Family Gym"
content_path = "./supabase/email-templates/troca-email.html"

[auth.email.template.recovery]
subject = "Redefina sua senha da Academia Family Gym"
content_path = "./supabase/email-templates/recuperacao.html"

[auth.email.template.reauthentication]
subject = "Seu código de confirmação Family Gym"
content_path = "./supabase/email-templates/reautenticacao.html"

[auth.email.notification.password_changed]
enabled = true
subject = "Sua senha da Family Gym foi alterada"
content_path = "./supabase/email-templates/senha-alterada.html"

[auth.email.notification.email_changed]
enabled = true
subject = "O e-mail da sua conta Family Gym foi alterado"
content_path = "./supabase/email-templates/email-alterado.html"

[auth.email.notification.identity_linked]
enabled = true
subject = "Uma nova forma de entrar foi adicionada à sua conta"
content_path = "./supabase/email-templates/identidade-vinculada.html"

[auth.email.notification.identity_unlinked]
enabled = true
subject = "Uma forma de entrar foi removida da sua conta"
content_path = "./supabase/email-templates/identidade-desvinculada.html"

[auth.email.notification.mfa_factor_enrolled]
enabled = true
subject = "Verificação em duas etapas ativada na sua conta"
content_path = "./supabase/email-templates/mfa-ativado.html"

[auth.email.notification.mfa_factor_unenrolled]
enabled = true
subject = "Verificação em duas etapas removida da sua conta"
content_path = "./supabase/email-templates/mfa-removido.html"
```

Para testar no computador com `supabase start`, os e-mails não saem de verdade: abra a caixa de teste
(Inbucket/Mailpit) no endereço mostrado pelo comando.

## SMTP próprio é obrigatório em produção

O envio padrão do Supabase serve só para testes: entrega apenas para pessoas da equipe do projeto,
tem limite muito baixo de e-mails por hora e o remetente é genérico (e-mails costumam cair no spam).
Para a Family Gym em produção:

1. Contrate um serviço de envio (por exemplo Resend, Brevo, Amazon SES, SendGrid ou o e-mail do seu
   domínio) e crie um endereço remetente do domínio da academia, como `nao-responda@seudominio.com.br`.
2. No painel: **Authentication > Emails > SMTP Settings**, ligue **Enable Custom SMTP** e informe
   servidor, porta, usuário, senha, e-mail do remetente e o nome **Academia Family Gym**.
3. No provedor de e-mail, configure os registros **SPF, DKIM e DMARC** do domínio (o provedor mostra
   o passo a passo). Sem isso, os e-mails de confirmação tendem a ir para o spam.
4. Depois de ligar o SMTP próprio, ajuste o limite de e-mails por hora em **Authentication > Rate
   Limits**. O app já espera 60 segundos entre dois reenvios.

## Logotipo

O topo dos e-mails usa o nome "Family GYM" em texto, na cor amarela da marca, porque muitos programas
de e-mail bloqueiam imagens. Para usar a imagem da marca: hospede o arquivo em um endereço público
(https) e troque o bloco marcado com `LOGOTIPO` em cada `.html` por uma tag `<img>` com o texto
alternativo "Family GYM".

## Como foi validado

Os 12 modelos foram carregados em um servidor de autenticação (GoTrue) real e cada e-mail foi
disparado de verdade (cadastro, recuperação, link mágico, troca de e-mail, convite, reautenticação,
senha alterada, e-mail alterado e verificação em duas etapas), conferindo que as variáveis foram
preenchidas, que os links funcionam e que o HTML renderiza bem no computador (600 px), no celular
(390 px) e no modo escuro. Os avisos de identidade vinculada/desvinculada usam o mesmo desenho e a
variável `{{ .Provider }}`, mas não foram disparados porque exigem login social.
