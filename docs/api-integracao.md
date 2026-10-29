# API de integração (catraca, Tecnofit e outros sistemas)

A API fica em `/api/v1` no mesmo endereço do site (por exemplo `https://<seu-site>/api/v1/saude`). A
descrição completa, para importar no Postman, Make ou n8n, está em `/api/v1/openapi.json`.

## 1. Como criar a chave

1. Entre no site como **gestão** e abra **Integrações** (`/integracoes`).
2. Dê um nome (ex.: "Catraca da entrada") e marque só as permissões necessárias.
3. Copie a chave (`fgk_...`). **Ela aparece uma única vez**; o banco guarda só o hash dela.
4. No sistema que vai chamar a API, envie a chave em todo pedido:
   `Authorization: Bearer fgk_...` (ou `X-Api-Key: fgk_...`).
5. Para cortar o acesso, use **Revogar**: a chave deixa de funcionar na hora.

A chave nunca vai na URL. Se o outro sistema só consegue chamar uma URL sem cabeçalhos, use uma
ferramenta intermediária (Make, n8n, Zapier) que acrescente o cabeçalho.

| Permissão             | O que libera                                     |
| --------------------- | ------------------------------------------------ |
| `acessos:escrever`    | Registrar entradas (catraca)                     |
| `acessos:ler`         | Perguntar se um aluno pode entrar                |
| `alunos:ler`          | Listar alunos (nome, contato, plano, situação)   |
| `alunos:escrever`     | Vincular o aluno ao código dele em outro sistema |
| `aulas:ler`           | Listar aulas e vagas                             |
| `pagamentos:escrever` | Dar baixa em parcelas pagas                      |

## 2. Controle de acesso (catraca) — passo a passo

**a) Vincular cada aluno ao código dele no outro sistema.** Na tela **Integrações**, em "Códigos em
outros sistemas", escolha o aluno, o sistema (`tecnofit`) e o código do aluno na Tecnofit. Quem integra
também pode fazer pela API (`PUT /alunos/ids-externos`). Alternativa sem código: a API aceita o e-mail
da ficha, desde que **só uma** ficha tenha aquele e-mail.

**b) Perguntar se pode entrar** (opcional, antes de liberar a catraca):

```sh
curl -s "https://<seu-site>/api/v1/acessos/verificar?provedor=tecnofit&idExterno=12345&bloquearAtrasoDias=15" \
  -H "Authorization: Bearer fgk_..."
# {"liberado":true,"motivo":null,"avisos":[],"aluno":{"id":"…","nome":"Ana","status":"Ativo"},"ultimoAcesso":null}
```

Aluno com status diferente de Ativo ou Risco é sempre bloqueado (`motivo: "plano-inativo"`). Os demais
bloqueios são **política da academia, escolhida em cada chamada**: `bloquearAtrasoDias=N` bloqueia quem
tem parcela atrasada há N dias ou mais, e `exigirTermo=true` bloqueia termo vencido. Sem esses
parâmetros, atraso e termo vencido só aparecem em `avisos`.

**c) Registrar a entrada** (depois que a catraca liberou):

```sh
curl -s -X POST "https://<seu-site>/api/v1/acessos" \
  -H "Authorization: Bearer fgk_..." -H "Content-Type: application/json" \
  -d '{"provedor":"tecnofit","idExterno":"12345","momento":"2026-10-11T08:30:00-03:00","dispositivo":"Catraca 1"}'
# 201 {"resultado":"registrado","alunoId":"…","momento":"2026-10-11T11:30:00.000Z"}
```

- Reenviar o mesmo evento é seguro: responde `200` com `"resultado":"duplicado"`.
- `momento` precisa de fuso (`-03:00` ou `Z`). Sem `momento`, vale "agora". Aceita até 30 dias no passado
  (para sincronizar catraca que ficou offline) e até 5 minutos no futuro.
- Os acessos aparecem para a equipe no banco (tabela `acessos`); o aluno vê só os próprios.

## 3. Outras rotas

- `GET /alunos?pagina=1&limite=100&atualizadoDesde=2026-10-01`: dados básicos, sem informações de saúde.
- `GET /aulas?de=2026-10-12&ate=2026-10-18`: aulas, vagas e ocupadas (máximo de 31 dias).
- `POST /pagamentos/baixa`: dá baixa numa parcela paga, por `pagamentoId` ou por aluno + `referencia`
  (baixa a parcela mais antiga em aberto daquela referência). Repetir é seguro (`ja-pago`).
- `GET /saude`: sem chave; serve para monitorar.

Erros vêm sempre como `{"erro":{"codigo":"...","mensagem":"..."}}` com o status HTTP certo (400 pedido
inválido, 401 chave ausente ou revogada, 403 sem permissão, 404 aluno não encontrado, 409 conflito).

## 4. Sobre a Tecnofit

Esta API é o lado do **nosso site**. Eu não tenho acesso à documentação nem a uma conta da Tecnofit,
então **não sei** quais APIs, webhooks ou formatos ela oferece ao seu plano. O que precisa ser
confirmado com a Tecnofit (suporte ou gerente de conta):

1. Se o seu plano tem **API ou webhooks** habilitados e onde ficam as credenciais.
2. Se ela consegue **enviar eventos de catraca/entrada** para uma URL (webhook), ou se só dá para
   **consultar** os eventos por API (nesse caso, uma ferramenta intermediária consulta a Tecnofit e chama
   `POST /acessos` para cada entrada nova).
3. Qual é o **código do aluno** (id) que ela usa e se ele aparece nos eventos.
4. Que cabeçalhos ela consegue mandar nos webhooks (se não conseguir mandar `Authorization`, use a
   ferramenta intermediária).

Com esses dados dá para ajustar o formato do evento da Tecnofit ao `POST /acessos` (um pequeno adaptador).
Enquanto isso, a API já funciona com qualquer catraca ou sistema que consiga chamar uma URL com JSON.

## 5. Segurança e limites

- **Limite de uso:** 120 chamadas por minuto por chave e 40 por minuto por endereço. Passou disso, a API responde `429 muitas_chamadas` com o cabeçalho `Retry-After` (segundos para esperar). O limite é por instância do servidor; para um teto global, use também a regra de Rate limiting da Cloudflare abaixo.

- Uma chave por sistema, com o mínimo de permissões; revogue as que não usa mais.
- Para um teto global (além do limite acima), ative na Cloudflare uma regra de limite de requisições
  (Security > WAF > Rate limiting rules) para `/api/*`.
- O histórico das chamadas que gravam dados ou falham fica em **Integrações > Últimas chamadas**. Leituras
  bem-sucedidas não são registradas.
- Corpos de pedido acima de 16 KB são recusados.

## 6. O que a API ainda NÃO faz

- **Avisos automáticos de saída** (WhatsApp, e-mail ao aluno quando abre vaga ou perto do vencimento):
  dependem de contratar um provedor (WhatsApp Business ou outro); a API de entrada não envia mensagens.
- **Confirmação automática de Pix:** a rota `POST /pagamentos/baixa` está pronta, mas quem a chamaria é o
  provedor de pagamento (Mercado Pago, Asaas, Efí...) por webhook, e a chave Pix simples da academia não
  avisa ninguém. Com um desses provedores, é um adaptador pequeno.
- **Frequência do aluno:** pronto. Os dias em que a catraca registrou entrada contam na sequência, no mapa e na meta mensal do aluno (como "Presença na academia", sem duração). Presença sozinha não marca o treino do dia como concluído.
