# Financeiro: lançar e gerar mensalidades

Tela **Financeiro** (`/financeiro`), para a **gestão** e a **recepção**. Mostra as parcelas de todos os alunos
(pagas, a vencer e em atraso), permite **dar baixa**, **reabrir** e **lembrar pelo WhatsApp**, e agora também
**criar** as cobranças. Antes disso, uma parcela só nascia direto no banco; sem parcelas, a tela, o app do aluno
(Meu plano) e os relatórios financeiros ficavam vazios.

## Duas formas de criar cobranças

### Lançar mensalidade (um aluno, uma ou várias parcelas)

Botão **Lançar mensalidade**. Procure o aluno, escolha o tipo e preencha:

- **Mensalidade**: a referência de cada parcela é o mês do vencimento (`11/2026`).
- **Outra cobrança** (matrícula, taxa, avaliação avulsa): informe o que está sendo cobrado; esse texto vira a
  referência. Pode repetir.
- **Valor de cada parcela**, **parcelas** (1 a 24), **primeiro vencimento** e **forma de pagamento** (Pix, Dinheiro,
  Cartão ou Boleto). Os vencimentos seguintes caem no mesmo dia dos meses seguintes; dia 29, 30 ou 31 vira o último
  dia dos meses mais curtos e volta ao dia original nos meses que o têm (31/01, 28/02, 31/03).
- Uma **prévia** lista cada parcela e o total antes de confirmar.
- O sistema **recusa** uma mensalidade para um mês em que o aluno já tem mensalidade (evita cobrar duas vezes).
  Parcelas canceladas não contam.

### Gerar mensalidades do mês (todos de uma vez)

Botão **Gerar mensalidades do mês**. Escolha o mês e confira a lista. Entram **os alunos ativos cuja última
parcela é de um mês anterior**; o valor, a forma de pagamento e o dia do vencimento **repetem a última parcela**.
Desmarque quem não deve receber e confirme.

Ficam de fora, de propósito:

- quem **já tem parcela naquele mês** (ou em mês posterior): repetir a geração não duplica nada;
- alunos **pendentes e inativos**;
- quem **nunca foi cobrado**: o sistema não inventa valor. Use **Lançar mensalidade** para a primeira cobrança.

O servidor **refaz a conta** na hora de gravar: se alguém recebeu parcela, ou deixou de ser ativo, entre a prévia e o
clique, essa pessoa não entra (a tela avisa quantas ficaram de fora).

## Corrigir uma cobrança

Só as parcelas **em aberto** (a vencer ou em atraso) podem ser corrigidas. Parcela **paga** nunca é editada nem
excluída: se precisar mexer nela, use **Reabrir** antes.

- **Editar**: menu **⋯** da parcela > _Editar parcela_. Muda o valor, o vencimento e a forma de pagamento, com os
  mesmos limites do lançamento. A **referência** (o mês da cobrança) não muda; se ela estiver errada, exclua a parcela
  e lance de novo.
- **Excluir uma**: menu **⋯** > _Excluir parcela_, com confirmação.
- **Excluir várias de uma vez** (por exemplo, o mês gerado errado): marque as caixas das parcelas (a caixa do
  cabeçalho marca todas as em aberto da lista) e use **Excluir selecionadas**. Os filtros de plano e situação ajudam a
  chegar só no que deve sair: a seleção vale apenas para o que está na tela, e trocar um filtro limpa a seleção. A
  confirmação mostra a quantidade, o total e quantos alunos são afetados.
- Se alguém der baixa numa parcela depois de ela ser selecionada, o servidor **não a exclui** e avisa quantas ficaram
  de fora.
- **Não há "desfazer"**: a parcela excluída é apagada de vez. Para gerar de novo, use **Lançar** ou **Gerar mensalidades
  do mês**.

## Preços

O site público nunca mostra preços, e esta tela também não consulta a tabela de valores dos planos: **o valor é
digitado pela equipe** ou **copiado da última parcela** do aluno. A tabela privada de valores (`planos_precos`)
continua separada.

## Cuidados

- Clique **uma vez** em Lançar/Gerar e espere a mensagem: dois cliques simultâneos podem criar parcelas em duplicidade
  (o botão fica desabilitado enquanto grava, e o servidor limita a 20 gravações por minuto por conta).
- Aluno **sem e-mail/conta** também recebe cobrança: a parcela é da ficha, não da conta de acesso.

## Para quem cuida do sistema

- Permissão: área `financeiro` (gestão e recepção) em `src/lib/papeis.ts`. O banco também confere (política
  "Staff gerencia pagamentos": gestão e recepção; o professor não acessa).
- Não há atualização de banco nova: as parcelas usam a tabela `pagamentos` e as restrições que ela já tem
  (`status` Pago/Pendente, `valor >= 0`, `parcela` entre 1 e o total).
- Código: regras puras e testadas em `src/lib/mensalidades.ts`; funções do servidor em
  `src/lib/mensalidades.functions.ts` (`lancarMensalidades`, `previaMensalidadesDoMes`, `gerarMensalidadesDoMes`);
  telas em `src/routes/_authenticated/financeiro.tsx` e `src/components/financeiro/`.
- Correções: `editarParcela` e `excluirParcelas` (mesmo arquivo), com a trava `status = Pendente` no próprio `UPDATE`
  e `DELETE` (parcela paga no meio do caminho fica intacta), até 100 parcelas por exclusão (a lista vai na URL da
  consulta; a tela divide em lotes) e limite de 60 correções por minuto por conta. Não existe histórico das exclusões
  no banco: o Worker registra no log, sem dado pessoal, só quem excluiu e quantas parcelas.
- Teste de ponta a ponta (lançar 3 parcelas, repetição recusada, gerar o mês sem duplicar, aluno inativo fora, editar,
  excluir uma e várias, parcela paga no meio do caminho preservada, exclusão de 230 parcelas em lotes): `bun run e2e`
  (ou `E2E_SO=financeiro bun run e2e` para rodar só este cenário).
- Integração por API: a baixa de parcelas por sistemas externos continua em `/api/v1/pagamentos/baixa`
  (veja `docs/api-integracao.md`).
