// Diagnóstico de configuração: transforma o que o servidor consegue enxergar (sem nunca devolver um
// segredo) em uma lista de itens "ok / atenção / erro" com o que fazer em cada caso. Só funções
// puras: a leitura do ambiente e do banco fica em diagnostico.functions.ts.

export type EstadoItem = "ok" | "atencao" | "erro";

export type ItemDiagnostico = {
  id: string;
  titulo: string;
  estado: EstadoItem;
  /** O que foi encontrado, em uma frase. */
  detalhe: string;
  /** O que fazer, quando não está ok. */
  correcao?: string;
};

// ------------------------------------------------------------------ chaves

/** Só o tipo da chave: o valor nunca sai do servidor. */
export type CategoriaChave =
  "ausente" | "publica" | "secreta" | "jwt-publica" | "jwt-secreta" | "jwt-outra" | "desconhecida";

function decodificarPayload(jwt: string): Record<string, unknown> | null {
  const partes = jwt.split(".");
  if (partes.length !== 3 || !partes[1]) return null;
  try {
    const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const bruto = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const json = new TextDecoder().decode(Uint8Array.from(bruto, (c) => c.charCodeAt(0)));
    const dados: unknown = JSON.parse(json);
    return dados && typeof dados === "object" ? (dados as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Descobre se uma chave do Supabase é a pública ou a secreta, sem expor o valor. */
export function classificarChave(valor: string | undefined | null): CategoriaChave {
  const v = (valor ?? "").trim();
  if (v === "") return "ausente";
  if (v.startsWith("sb_publishable_")) return "publica";
  if (v.startsWith("sb_secret_")) return "secreta";
  const payload = decodificarPayload(v);
  if (payload) {
    if (payload["role"] === "anon") return "jwt-publica";
    if (payload["role"] === "service_role") return "jwt-secreta";
    return "jwt-outra";
  }
  return "desconhecida";
}

export const ehChavePublica = (c: CategoriaChave) => c === "publica" || c === "jwt-publica";
export const ehChaveSecreta = (c: CategoriaChave) => c === "secreta" || c === "jwt-secreta";

const ROTULO_CHAVE: Record<CategoriaChave, string> = {
  ausente: "não definida",
  publica: "chave pública (sb_publishable)",
  secreta: "chave secreta (sb_secret)",
  "jwt-publica": "chave pública (anon)",
  "jwt-secreta": "chave secreta (service_role)",
  "jwt-outra": "chave de outro tipo",
  desconhecida: "formato não reconhecido",
};

// ------------------------------------------------------------------ entrada

export type ResultadoSonda = { ok: true } | { ok: false; codigo: string | null };

/** Tabela criada por uma etapa do SQL; `arquivo` diz qual rodar quando falta. */
export type SondaTabela = { tabela: string; resultado: ResultadoSonda };

export type EntradaDiagnostico = {
  url: { host: string | null; definida: boolean };
  chavePublica: CategoriaChave;
  chaveSecreta: CategoriaChave;
  siteUrl: string | null;
  testeDaChaveSecreta: ResultadoSonda | null;
  testeDoBanco: ResultadoSonda | null;
  tabelas: SondaTabela[];
  perfisDaEquipe: ResultadoSonda | null;
  /** Chamada de teste (sem efeito) da função do banco que ativa a primeira conta de gestão. */
  funcaoDaGestao: ResultadoSonda | null;
  gestao: {
    variavelDefinida: boolean;
    emailConfere: boolean;
    existeGestao: boolean | null;
  };
  conta: {
    email: string | null;
    confirmada: boolean | null;
    perfis: string[];
    alunoVinculado: boolean | null;
  };
};

/** Que parte do SQL cria cada tabela (as demais vêm das partes 1 e 2). */
export const ARQUIVO_DA_TABELA: Record<string, string> = {
  registros_carga: "supabase/publicar/atualizacoes/20261011000700_registros_carga.sql",
};
const ARQUIVO_PADRAO = "supabase/publicar/2-banco-parte-2.sql";

export const TABELAS_ESPERADAS = [
  "alunos",
  "user_roles",
  "planos_precos",
  "reservas_aula",
  "integracao_chaves",
  "acessos",
  "interessados",
  "lgpd_registros",
  "registros_carga",
] as const;

const SQL_PARTES =
  "No Supabase, abra SQL Editor, cole o arquivo indicado e clique em Run. Se já rodou, pode rodar de novo.";

function tabelaAusente(codigo: string | null): boolean {
  return codigo === "42P01" || codigo === "PGRST205";
}

// ------------------------------------------------------------------ montagem

export function montarDiagnostico(e: EntradaDiagnostico): ItemDiagnostico[] {
  const itens: ItemDiagnostico[] = [];

  // 1) Endereço do Supabase
  itens.push(
    e.url.definida
      ? {
          id: "url",
          titulo: "Endereço do Supabase",
          estado: "ok",
          detalhe: e.url.host ? `Conectado a ${e.url.host}.` : "Definido.",
        }
      : {
          id: "url",
          titulo: "Endereço do Supabase",
          estado: "erro",
          detalhe: "Não está definido.",
          correcao:
            "Na Cloudflare: Workers & Pages > familygym > Settings > Build > Variables and secrets. Crie VITE_SUPABASE_URL com o Project URL do Supabase e clique em Retry build.",
        },
  );

  // 2) Chave pública
  if (e.chavePublica === "ausente") {
    itens.push({
      id: "chave-publica",
      titulo: "Chave pública do Supabase",
      estado: "erro",
      detalhe: "Não está definida.",
      correcao:
        "Crie VITE_SUPABASE_PUBLISHABLE_KEY em Build > Variables and secrets (Project Settings > API Keys > Publishable key) e clique em Retry build.",
    });
  } else if (ehChaveSecreta(e.chavePublica)) {
    itens.push({
      id: "chave-publica",
      titulo: "Chave pública do Supabase",
      estado: "erro",
      detalhe:
        "Há uma chave SECRETA no lugar da pública. Ela vai para o navegador de todos os visitantes.",
      correcao:
        "Troque agora VITE_SUPABASE_PUBLISHABLE_KEY pela Publishable key, faça Retry build e, no Supabase, gere uma chave secreta nova (a atual deve ser considerada vazada).",
    });
  } else {
    itens.push({
      id: "chave-publica",
      titulo: "Chave pública do Supabase",
      estado: ehChavePublica(e.chavePublica) ? "ok" : "atencao",
      detalhe: `Configurada: ${ROTULO_CHAVE[e.chavePublica]}.`,
      ...(ehChavePublica(e.chavePublica)
        ? {}
        : { correcao: "Confira se é a Publishable key (Project Settings > API Keys)." }),
    });
  }

  // 3) Chave secreta do servidor
  if (e.chaveSecreta === "ausente") {
    itens.push({
      id: "chave-secreta",
      titulo: "Chave secreta do servidor",
      estado: "erro",
      detalhe:
        "SUPABASE_SERVICE_ROLE_KEY não está definida no servidor. Vínculos, relatórios e a ativação da gestão dependem dela.",
      correcao:
        "Na Cloudflare: Settings > Variables and secrets (a parte de runtime, não a de Build). Crie SUPABASE_SERVICE_ROLE_KEY com o tipo Secret, cole a Secret key do Supabase e faça um novo Deploy.",
    });
  } else if (ehChavePublica(e.chaveSecreta)) {
    itens.push({
      id: "chave-secreta",
      titulo: "Chave secreta do servidor",
      estado: "erro",
      detalhe:
        "SUPABASE_SERVICE_ROLE_KEY contém a chave PÚBLICA. O servidor não consegue fazer o trabalho administrativo.",
      correcao:
        "No Supabase (Project Settings > API Keys) copie a Secret key (começa com sb_secret_) e substitua o valor de SUPABASE_SERVICE_ROLE_KEY na Cloudflare. Depois faça um novo Deploy.",
    });
  } else {
    itens.push({
      id: "chave-secreta",
      titulo: "Chave secreta do servidor",
      estado: ehChaveSecreta(e.chaveSecreta) ? "ok" : "atencao",
      detalhe: `Configurada: ${ROTULO_CHAVE[e.chaveSecreta]}.`,
      ...(ehChaveSecreta(e.chaveSecreta)
        ? {}
        : {
            correcao:
              "O formato não é o esperado. Confira se copiou a Secret key inteira, sem espaços.",
          }),
    });
  }

  // 4) A chave secreta funciona?
  if (e.testeDaChaveSecreta) {
    itens.push(
      e.testeDaChaveSecreta.ok
        ? {
            id: "chave-funciona",
            titulo: "O Supabase aceita a chave secreta",
            estado: "ok",
            detalhe: "O servidor conseguiu usar a área administrativa do Supabase.",
          }
        : {
            id: "chave-funciona",
            titulo: "O Supabase aceita a chave secreta",
            estado: "erro",
            detalhe: `O Supabase recusou a chave${e.testeDaChaveSecreta.codigo ? ` (código ${e.testeDaChaveSecreta.codigo})` : ""}.`,
            correcao:
              "A chave está errada, incompleta ou é de outro projeto. Copie de novo a Secret key do MESMO projeto do endereço acima e faça um novo Deploy.",
          },
    );
  }

  // 5) Banco
  if (e.testeDoBanco) {
    if (e.testeDoBanco.ok) {
      itens.push({
        id: "banco",
        titulo: "Banco de dados",
        estado: "ok",
        detalhe: "O servidor leu a tabela de alunos.",
      });
    } else if (tabelaAusente(e.testeDoBanco.codigo)) {
      itens.push({
        id: "banco",
        titulo: "Banco de dados",
        estado: "erro",
        detalhe: "A tabela de alunos não existe: o SQL do banco ainda não foi aplicado.",
        correcao: `Rode, nesta ordem, supabase/publicar/1-banco-parte-1.sql e 2-banco-parte-2.sql. ${SQL_PARTES}`,
      });
    } else {
      itens.push({
        id: "banco",
        titulo: "Banco de dados",
        estado: "erro",
        detalhe: `Não foi possível ler os alunos${e.testeDoBanco.codigo ? ` (código ${e.testeDoBanco.codigo})` : ""}.`,
        correcao: "Se o item anterior também falhou, corrija a chave secreta primeiro.",
      });
    }
  }

  // 6) Atualizações do banco
  const faltando = e.tabelas.filter((t) => !t.resultado.ok && tabelaAusente(t.resultado.codigo));
  const comErro = e.tabelas.filter((t) => !t.resultado.ok && !tabelaAusente(t.resultado.codigo));
  if (e.tabelas.length > 0) {
    if (faltando.length > 0) {
      const arquivos = [
        ...new Set(faltando.map((t) => ARQUIVO_DA_TABELA[t.tabela] ?? ARQUIVO_PADRAO)),
      ];
      itens.push({
        id: "atualizacoes",
        titulo: "Atualizações do banco",
        estado: "atencao",
        detalhe: `Faltam ${faltando.length} tabela(s): ${faltando.map((t) => t.tabela).join(", ")}.`,
        correcao: `Rode ${arquivos.join(" e ")}. ${SQL_PARTES}`,
      });
    } else if (comErro.length > 0) {
      itens.push({
        id: "atualizacoes",
        titulo: "Atualizações do banco",
        estado: "atencao",
        detalhe: `Não foi possível conferir: ${comErro.map((t) => t.tabela).join(", ")}.`,
        correcao: "Se a chave secreta ainda não funciona, corrija-a primeiro.",
      });
    } else {
      itens.push({
        id: "atualizacoes",
        titulo: "Atualizações do banco",
        estado: "ok",
        detalhe: `Todas as ${e.tabelas.length} tabelas esperadas existem.`,
      });
    }
  }

  // 7) Perfis da equipe
  if (e.perfisDaEquipe) {
    itens.push(
      e.perfisDaEquipe.ok
        ? {
            id: "perfis",
            titulo: "Perfis da equipe",
            estado: "ok",
            detalhe: "Gestão, recepção e professor existem no banco.",
          }
        : {
            id: "perfis",
            titulo: "Perfis da equipe",
            estado: "atencao",
            detalhe: "Os perfis de recepção e professor ainda não existem.",
            correcao: `Rode supabase/publicar/2-banco-parte-2.sql. ${SQL_PARTES}`,
          },
    );
  }

  // 7b) A função que ativa a gestão
  if (e.funcaoDaGestao) {
    const f = e.funcaoDaGestao;
    if (f.ok) {
      itens.push({
        id: "funcao-gestao",
        titulo: "Função que ativa a gestão",
        estado: "ok",
        detalhe:
          "O servidor consegue chamar a função do banco que ativa a primeira conta de gestão.",
      });
    } else if (f.codigo === "PGRST202" || f.codigo === "42883") {
      itens.push({
        id: "funcao-gestao",
        titulo: "Função que ativa a gestão",
        estado: "erro",
        detalhe: "A função do banco que ativa a primeira conta de gestão não existe.",
        correcao: `Rode, nesta ordem, supabase/publicar/1-banco-parte-1.sql e 2-banco-parte-2.sql. ${SQL_PARTES}`,
      });
    } else {
      itens.push({
        id: "funcao-gestao",
        titulo: "Função que ativa a gestão",
        estado: "erro",
        detalhe: `O servidor não conseguiu chamar a função que ativa a gestão${f.codigo ? ` (código ${f.codigo})` : ""}.`,
        correcao:
          "Quase sempre é a chave secreta errada (a pública no lugar da secreta). Confira os itens acima e a variável SUPABASE_SERVICE_ROLE_KEY.",
      });
    }
  }

  // 8) Primeira conta de gestão
  const g = e.gestao;
  if (g.existeGestao === true) {
    itens.push({
      id: "gestao",
      titulo: "Conta de gestão",
      estado: "ok",
      detalhe: e.conta.perfis.includes("staff")
        ? "Já existe gestão e esta conta é uma delas."
        : "Já existe gestão. Esta conta não é gestão: peça a quem já é para dar o perfil em Vínculos.",
    });
  } else if (g.existeGestao === false) {
    if (!g.variavelDefinida) {
      itens.push({
        id: "gestao",
        titulo: "Conta de gestão",
        estado: "erro",
        detalhe:
          "Ainda não existe nenhuma conta de gestão e STAFF_BOOTSTRAP_EMAIL não está definida.",
        correcao:
          "Na Cloudflare: Settings > Variables and secrets (runtime). Crie STAFF_BOOTSTRAP_EMAIL (tipo Secret) com o e-mail desta conta, faça um novo Deploy e abra /vinculos.",
      });
    } else if (!g.emailConfere) {
      itens.push({
        id: "gestao",
        titulo: "Conta de gestão",
        estado: "erro",
        detalhe: "O e-mail autorizado em STAFF_BOOTSTRAP_EMAIL é diferente do e-mail desta conta.",
        correcao:
          "Entre com a conta autorizada ou ajuste STAFF_BOOTSTRAP_EMAIL para o e-mail desta conta (sem espaços), faça um novo Deploy e abra /vinculos.",
      });
    } else if (e.conta.confirmada === false) {
      itens.push({
        id: "gestao",
        titulo: "Conta de gestão",
        estado: "atencao",
        detalhe: "O e-mail desta conta ainda não foi confirmado.",
        correcao:
          "Abra o e-mail de confirmação do Supabase (veja também o spam) e clique no link. Depois abra /vinculos.",
      });
    } else {
      itens.push({
        id: "gestao",
        titulo: "Conta de gestão",
        estado: "ok",
        detalhe:
          "Esta conta pode ativar a gestão. Abra /vinculos e clique em “Ativar perfil da equipe”.",
      });
    }
  }

  // 9) Esta conta
  itens.push({
    id: "conta",
    titulo: "Esta conta",
    estado: e.conta.confirmada === false ? "atencao" : "ok",
    detalhe: [
      e.conta.email ?? "e-mail desconhecido",
      e.conta.confirmada === null
        ? null
        : e.conta.confirmada
          ? "e-mail confirmado"
          : "e-mail NÃO confirmado",
      e.conta.perfis.length ? `perfis: ${e.conta.perfis.join(", ")}` : "sem perfil ainda",
      e.conta.alunoVinculado === null
        ? null
        : e.conta.alunoVinculado
          ? "ligada a um aluno"
          : "não ligada a um aluno",
    ]
      .filter((x): x is string => x !== null)
      .join(" · "),
    ...(e.conta.confirmada === false
      ? { correcao: "Confirme o e-mail pelo link que o Supabase enviou." }
      : {}),
  });

  // 10) Endereço público do site
  itens.push(
    e.siteUrl
      ? { id: "site-url", titulo: "Endereço público do site", estado: "ok", detalhe: e.siteUrl }
      : {
          id: "site-url",
          titulo: "Endereço público do site",
          estado: "atencao",
          detalhe: "VITE_SITE_URL não está definida.",
          correcao:
            "Crie VITE_SITE_URL (Build > Variables) com o endereço do site, sem barra no final, e faça Retry build. Sem ela, os links e as prévias nas redes sociais ficam incompletos.",
        },
  );

  return itens;
}

export type ResumoDoDiagnostico = { erros: number; atencoes: number; ok: number };

export function resumirDiagnostico(itens: readonly ItemDiagnostico[]): ResumoDoDiagnostico {
  return {
    erros: itens.filter((i) => i.estado === "erro").length,
    atencoes: itens.filter((i) => i.estado === "atencao").length,
    ok: itens.filter((i) => i.estado === "ok").length,
  };
}

const MARCA: Record<EstadoItem, string> = { ok: "[OK]", atencao: "[ATENÇÃO]", erro: "[ERRO]" };

/** Texto para copiar e enviar a quem dá suporte. Não contém segredos: só o que a tela mostra. */
export function textoDoDiagnostico(itens: readonly ItemDiagnostico[], geradoEm: string): string {
  return [
    `Diagnóstico Family Gym · ${geradoEm}`,
    ...itens.map(
      (i) =>
        `${MARCA[i.estado]} ${i.titulo}: ${i.detalhe}${i.correcao ? `\n    O que fazer: ${i.correcao}` : ""}`,
    ),
  ].join("\n");
}
