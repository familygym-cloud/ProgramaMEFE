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
