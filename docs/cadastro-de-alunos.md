# Cadastro de alunos

Tela **Alunos** (`/alunos`), para a **gestão** e a **recepção**. Antes dela, a única forma de criar um aluno era
direto no banco; sem alunos, os relatórios, as mensalidades e os treinos ficam vazios.

## O que dá para fazer

- **Buscar** por nome, e-mail ou telefone e **filtrar** por situação (ativos, pendentes, inativos) ou por quem
  ainda **não tem conta de acesso**.
- **Novo aluno** e **Editar**: só o nome e o plano são obrigatórios. Altura e peso geram o IMC sozinhos; o que ficar em
  branco (idade, altura, peso) aparece como "sem dado" nos relatórios até a primeira avaliação.
- **Cobrar**: botão em cada aluno (menos nos inativos) que abre o **Financeiro** já no lançamento de mensalidade
  daquele aluno. Ao **cadastrar um aluno novo**, o aviso de sucesso também oferece **Lançar mensalidade** (fica uns
  segundos na tela), então a primeira cobrança é um clique depois do cadastro.
- **Inativar / Reativar** sem abrir a ficha. Quem é inativado deixa de contar como aluno ativo nos relatórios.
- **Importar planilha** (CSV) com a prévia do que entra, do que já existe e do que tem erro.
- **Cadastrar como aluno**, na tela **Interessados**: abre o formulário já preenchido com os dados do pedido e, ao
  salvar, o pedido vira "matriculado".

## Conta de acesso do aluno

O e-mail da ficha é o que liga o aluno à conta dele: quando ele cria o acesso em `/auth` com **o mesmo e-mail** (e
confirma o e-mail), a conta se liga sozinha à ficha. Sem e-mail na ficha, a recepção liga a conta à mão em
**Vínculos**. A coluna "Conta de acesso" mostra quem já está ligado.

## Planilha para importar

Salve como **CSV** (no Excel: _Salvar como > CSV_; o sistema entende o formato brasileiro com `;` e os acentos do
Excel). A primeira linha tem os títulos; a ordem das colunas não importa. Há uma planilha de exemplo para baixar na
própria tela.

| Coluna (outros nomes aceitos)                   | Obrigatória | Observação                                                      |
| ----------------------------------------------- | ----------- | --------------------------------------------------------------- |
| Nome (Aluno, Nome completo, Cliente)            | sim         | 2 a 100 caracteres                                              |
| Plano (Contrato)                                | sim\*       | \*ou escolha um "plano padrão" na tela para as linhas sem plano |
| E-mail                                          | não         | liga a conta do aluno à ficha                                   |
| Telefone (Celular, WhatsApp)                    | não         | com DDD; aceita máscara e `+55`                                 |
| Turno (Período)                                 | não         | Manhã, Tarde ou Noite (padrão: Manhã)                           |
| Status (Situação)                               | não         | Ativo, Pendente ou Inativo (padrão: Ativo)                      |
| Idade, Altura, Peso                             | não         | altura em cm ou em metros (`1,70`); peso com vírgula ou ponto   |
| Matrícula (Data de matrícula, Cadastro, Início) | não         | `dd/mm/aaaa` ou `aaaa-mm-dd`; padrão: hoje; não pode ser futura |
| Objetivo, Observações                           | não         |                                                                 |

Regras e limites:

- Até **1000 alunos** por importação e 1,5 MB por arquivo. Colunas que o sistema não conhece são ignoradas (a tela lista).
- **Tudo ou nada**: os alunos novos entram numa única gravação; se algo falhar, nada entra.
- **Duplicados ficam de fora** e a tela diz o motivo: mesmo e-mail; ou mesmo nome com o mesmo telefone; ou mesmo nome
  sem e-mail ou telefone para confirmar (nesse caso, se for outra pessoa, cadastre em _Novo aluno_). Nomes iguais com
  e-mails diferentes, ou com telefones diferentes, são tratados como pessoas diferentes.
- O servidor **refaz a análise** do texto recebido antes de gravar; a prévia da tela é só uma conferência.

## Para quem cuida do sistema

- Permissão: área `alunos` (gestão e recepção) em `src/lib/papeis.ts`; o banco também confere (política "Staff gerencia
  alunos"). O professor só lê.
- Código: regras em `src/lib/cadastro-alunos.ts` e `src/lib/importacao-alunos.ts` (puras, com testes), funções do
  servidor em `src/lib/cadastro-alunos.functions.ts`, telas em `src/routes/_authenticated/alunos.tsx` e
  `src/components/alunos/`.
- Teste de ponta a ponta do roteiro (cadastrar, e-mail repetido, importar, inativar, buscar, abrir a partir de um
  pedido do site): `bun run e2e`.
