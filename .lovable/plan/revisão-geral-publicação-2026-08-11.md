# Revisão geral + publicação

## O que já existe hoje

- **Home pública** (`/`) com a identidade preto e amarelo e a logo Family Gym, com botão de acesso.
- **Tela de acesso** (`/auth`) com login/cadastro por e-mail e senha, na identidade da marca.
- **Painel protegido** (`/dashboard`, só com login): KPIs, gráficos de evolução, distribuição de planos, frequência por turno, radar de saúde integral, tabela de alunos e a ficha individual completa do aluno selecionado.
- **Banco de dados**: alunos (8), avaliações (32), check-ins (21), assinaturas de relatório (8) e tabela de papéis.
- **Permissões por perfil**: staff vê e gerencia tudo; aluno vê apenas a própria ficha. Funções internas de permissão já movidas para fora da API pública (scan de segurança sem pendências).
- **Relatórios em PDF** já gerados como arquivos (progresso por aluno com assinatura, e a lista consolidada de assinaturas).

## Ponto que precisa ser resolvido antes de publicar

Verifiquei o banco: **nenhum usuário tem papel atribuído ainda** (`user_roles` está vazio) e **nenhum aluno está vinculado a um login** (`alunos.user_id` todos vazios). Consequência prática: se você entrar hoje no painel publicado, ele abre como "sem perfil" e não mostra nenhum dado — não é um bug de código, é só a falta do primeiro cadastro/papel.

## Passos

1. **Criar seu acesso de staff**: você cria a conta em `/auth` (e-mail e senha) e eu atribuo o papel `staff` a esse e-mail. A partir daí o painel mostra todos os alunos.
2. **(Opcional) Acesso dos alunos**: para cada aluno que for usar o app, ele cria a conta e eu vinculo o login à ficha dele e atribuo o papel `aluno` — passando a ver só os próprios dados.
3. **Publicar** o app em `https://familygym-healthhub.lovable.app` e conferir home, acesso e painel no ar.

## Ordem sugerida

Se você quiser ver publicado agora mesmo, eu publico primeiro (passo 3) e depois fazemos o passo 1 com sua conta — o app fica no ar já funcional, só aguardando seu primeiro login.

## Detalhes técnicos

- Atribuição de papel via inserção em `public.user_roles` (`role = 'staff'`) usando o `id` do usuário em `auth.users`, após o cadastro.
- Vínculo de aluno via atualização de `public.alunos.user_id` com o `id` do usuário correspondente.
- Nenhuma alteração de schema ou de código é necessária; apenas dados.
- Publicação com `preview_ui--publish` após checagem do scan de segurança.
