// Descrição OpenAPI 3.0 da API pública (/api/v1). Serve para quem integra (Tecnofit, catraca, Make,
// n8n, Postman) importar a API pronta. Mantida junto do código: o teste confere que cada rota existe.
import { DESCRICAO_ESCOPO, ESCOPOS } from "./chaves";

const erroRef = { $ref: "#/components/schemas/Erro" };
const respostasComuns = {
  "400": { description: "Pedido inválido", content: { "application/json": { schema: erroRef } } },
  "401": {
    description: "Chave ausente, inválida ou revogada",
    content: { "application/json": { schema: erroRef } },
  },
  "403": {
    description: "A chave não tem a permissão da rota",
    content: { "application/json": { schema: erroRef } },
  },
};

const referenciaDoAluno = {
  alunoId: { type: "string", format: "uuid", description: "Id do aluno neste sistema" },
  provedor: {
    type: "string",
    example: "tecnofit",
    description: "Sistema de origem do código (use com idExterno)",
  },
  idExterno: { type: "string", example: "12345", description: "Código do aluno no outro sistema" },
  email: { type: "string", format: "email", description: "E-mail da ficha (só vale se for único)" },
};

export const OPENAPI = {
  openapi: "3.0.3",
  info: {
    title: "API da Academia Family Gym",
    version: "1.0.0",
    description:
      "Integração com catraca, Tecnofit e outros sistemas. Autenticação por chave de API criada em /integracoes: envie `Authorization: Bearer <chave>` (ou `X-Api-Key`). Informe o aluno por `alunoId`, por `provedor` + `idExterno` ou por `email`.",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: { chave: { type: "http", scheme: "bearer", description: "Chave `fgk_...`" } },
    schemas: {
      Erro: {
        type: "object",
        properties: {
          erro: {
            type: "object",
            properties: { codigo: { type: "string" }, mensagem: { type: "string" } },
          },
        },
      },
    },
  },
  security: [{ chave: [] }],
  paths: {
    "/saude": {
      get: {
        summary: "Verifica se a API está no ar (sem chave)",
        security: [],
        responses: { "200": { description: "OK" } },
      },
    },
    "/acessos": {
      post: {
        summary: "Registra a entrada de um aluno (catraca)",
        description: `Permissão: acessos:escrever. Reenviar o mesmo aluno no mesmo momento é seguro (responde 200 \`duplicado\`). O momento pode ser até 5 minutos no futuro e até 30 dias no passado.`,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  ...referenciaDoAluno,
                  momento: {
                    type: "string",
                    format: "date-time",
                    description: "ISO 8601 com fuso; padrão: agora",
                  },
                  origem: {
                    type: "string",
                    enum: ["catraca", "recepcao", "api"],
                    default: "catraca",
                  },
                  dispositivo: { type: "string", example: "Catraca 1" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Entrada registrada" },
          "200": { description: "Esta entrada já tinha sido registrada" },
          "404": {
            description: "Aluno não encontrado",
            content: { "application/json": { schema: erroRef } },
          },
          ...respostasComuns,
        },
      },
    },
    "/acessos/verificar": {
      get: {
        summary: "O aluno pode entrar?",
        description:
          "Permissão: acessos:ler. A política é escolhida na chamada: `bloquearAtrasoDias=N` bloqueia quem tem parcela atrasada há N dias ou mais; `exigirTermo=true` bloqueia termo vencido. Aluno com status diferente de Ativo/Risco é sempre bloqueado.",
        parameters: [
          ...Object.entries(referenciaDoAluno).map(([name, schema]) => ({
            name,
            in: "query",
            schema,
          })),
          {
            name: "bloquearAtrasoDias",
            in: "query",
            schema: { type: "integer", minimum: 0, maximum: 365, default: 0 },
          },
          { name: "exigirTermo", in: "query", schema: { type: "boolean", default: false } },
        ],
        responses: {
          "200": {
            description: "Decisão",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    liberado: { type: "boolean" },
                    motivo: {
                      type: "string",
                      nullable: true,
                      enum: ["plano-inativo", "mensalidade-atrasada", "termo-vencido"],
                    },
                    avisos: { type: "array", items: { type: "string" } },
                    aluno: { type: "object" },
                    ultimoAcesso: { type: "string", format: "date-time", nullable: true },
                  },
                },
              },
            },
          },
          "404": {
            description: "Aluno não encontrado",
            content: { "application/json": { schema: erroRef } },
          },
          ...respostasComuns,
        },
      },
    },
    "/alunos": {
      get: {
        summary: "Lista alunos (dados básicos, sem informações de saúde)",
        description: "Permissão: alunos:ler.",
        parameters: [
          { name: "pagina", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          {
            name: "limite",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 200, default: 100 },
          },
          { name: "atualizadoDesde", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { "200": { description: "Página de alunos" }, ...respostasComuns },
      },
    },
    "/alunos/ids-externos": {
      put: {
        summary: "Vincula o aluno ao código dele em outro sistema",
        description: "Permissão: alunos:escrever. Identifique o aluno por alunoId ou email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["provedor", "idExterno"],
                properties: {
                  alunoId: referenciaDoAluno.alunoId,
                  email: referenciaDoAluno.email,
                  provedor: referenciaDoAluno.provedor,
                  idExterno: referenciaDoAluno.idExterno,
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Vínculo gravado" },
          "404": {
            description: "Aluno não encontrado",
            content: { "application/json": { schema: erroRef } },
          },
          "409": {
            description: "Código já usado por outro aluno",
            content: { "application/json": { schema: erroRef } },
          },
          ...respostasComuns,
        },
      },
    },
    "/aulas": {
      get: {
        summary: "Lista aulas e vagas",
        description: "Permissão: aulas:ler. Intervalo máximo de 31 dias; padrão: hoje.",
        parameters: [
          { name: "de", in: "query", schema: { type: "string", format: "date" } },
          { name: "ate", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { "200": { description: "Aulas do período" }, ...respostasComuns },
      },
    },
    "/pagamentos/baixa": {
      post: {
        summary: "Dá baixa em uma parcela paga",
        description:
          "Permissão: pagamentos:escrever. Informe `pagamentoId`, ou o aluno com a `referencia` da parcela (ex.: Mensalidade 10/2026; baixa a mais antiga em aberto). Repetir a baixa é seguro (`ja-pago`).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  pagamentoId: { type: "string", format: "uuid" },
                  ...referenciaDoAluno,
                  referencia: { type: "string" },
                  pagoEm: { type: "string", format: "date", description: "Padrão: hoje" },
                  metodo: { type: "string", example: "Pix" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "`baixado` ou `ja-pago`" },
          "404": {
            description: "Parcela ou aluno não encontrado",
            content: { "application/json": { schema: erroRef } },
          },
          ...respostasComuns,
        },
      },
    },
  },
  "x-permissoes": Object.fromEntries(ESCOPOS.map((e) => [e, DESCRICAO_ESCOPO[e]])),
};
