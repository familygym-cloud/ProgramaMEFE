import { afterEach, describe, expect, it, vi } from "vitest";
import {
  baixarCsv,
  celulaParaTexto,
  escaparCampo,
  gerarCsv,
  neutralizarFormula,
  nomeArquivoCsv,
  type ColunaCsv,
} from "./csv";

const BOM = "﻿";

type Linha = { nome: string; valor: number | string | null };
const colunasBasicas: ColunaCsv<Linha>[] = [
  { titulo: "Nome", chave: "nome" },
  { titulo: "Valor", valor: (l) => l.valor },
];

describe("estrutura do arquivo", () => {
  it("começa com BOM UTF-8, separa por ponto e vírgula e quebra linha com CRLF", () => {
    const csv = gerarCsv(colunasBasicas, [
      { nome: "Ana", valor: 10 },
      { nome: "Bia", valor: 20 },
    ]);
    expect(csv).toBe(`${BOM}Nome;Valor\r\nAna;10\r\nBia;20`);
  });

  it("sem linhas devolve só o cabeçalho", () => {
    expect(gerarCsv(colunasBasicas, [])).toBe(`${BOM}Nome;Valor`);
  });

  it("sem colunas e sem linhas devolve só o BOM", () => {
    expect(gerarCsv([], [])).toBe(BOM);
  });

  it("lê a célula pela chave da propriedade ou por função", () => {
    const csv = gerarCsv<Linha>(
      [
        { titulo: "A", chave: "nome" },
        { titulo: "B", valor: (l) => l.nome.toUpperCase() },
      ],
      [{ nome: "Ana", valor: 1 }],
    );
    expect(csv).toBe(`${BOM}A;B\r\nAna;ANA`);
  });
});

describe("campos com caracteres especiais", () => {
  it("vírgula no texto não exige aspas (o separador é ponto e vírgula)", () => {
    expect(escaparCampo("Silva, Ana")).toBe("Silva, Ana");
  });

  it("ponto e vírgula no texto leva aspas", () => {
    expect(escaparCampo("a;b")).toBe('"a;b"');
  });

  it("aspas duplas são dobradas e o campo vai entre aspas", () => {
    expect(escaparCampo('Disse "oi"')).toBe('"Disse ""oi"""');
  });

  it("quebra de linha dentro do campo fica preservada entre aspas", () => {
    expect(escaparCampo("linha 1\nlinha 2")).toBe('"linha 1\nlinha 2"');
    expect(escaparCampo("linha 1\r\nlinha 2")).toBe('"linha 1\r\nlinha 2"');
  });

  it("monta uma linha com todos os casos juntos", () => {
    const csv = gerarCsv(colunasBasicas, [{ nome: 'Ana "A";\nB', valor: "x, y" }]);
    expect(csv).toBe(`${BOM}Nome;Valor\r\n"Ana ""A"";\nB";x, y`);
  });

  it("aspas simples e texto comum passam sem alteração", () => {
    expect(escaparCampo("O'Brien")).toBe("O'Brien");
    expect(escaparCampo("Ação")).toBe("Ação");
    expect(escaparCampo("")).toBe("");
  });
});

describe("proteção contra injeção de fórmula", () => {
  it.each([
    ["=SOMA(A1:A2)", "'=SOMA(A1:A2)"],
    ["+55 11 99999-0000", "'+55 11 99999-0000"],
    ["-2+3", "'-2+3"],
    ["@SOMA(1)", "'@SOMA(1)"],
    ["\t=1+1", "'\t=1+1"],
    ["\r=1+1", "'\r=1+1"],
    ["  =1+1", "'  =1+1"],
    ["\n=1+1", "'\n=1+1"],
  ])("prefixa apóstrofo em %j", (entrada, esperado) => {
    expect(neutralizarFormula(entrada)).toBe(esperado);
  });

  it.each(["Ana", "a=b", "1+1", "Rua 5 - Centro", "'=já tem apóstrofo", ""])(
    "não mexe em %j",
    (texto) => {
      expect(neutralizarFormula(texto)).toBe(texto);
    },
  );

  it("aplica nas células de texto do arquivo", () => {
    const csv = gerarCsv(colunasBasicas, [{ nome: "=1+1", valor: "@x" }]);
    expect(csv).toBe(`${BOM}Nome;Valor\r\n'=1+1;'@x`);
  });

  it("fórmula maliciosa com aspas e ponto e vírgula fica neutralizada E escapada", () => {
    const csv = gerarCsv(colunasBasicas, [
      { nome: '=HYPERLINK("http://x.test";"clique")', valor: 1 },
    ]);
    expect(csv).toBe(`${BOM}Nome;Valor\r\n"'=HYPERLINK(""http://x.test"";""clique"")";1`);
  });

  it("também protege o cabeçalho", () => {
    const csv = gerarCsv([{ titulo: "=evil()", chave: "nome" }], [{ nome: "a", valor: 1 }]);
    expect(csv).toBe(`${BOM}'=evil()\r\na`);
  });

  it("número negativo NÃO é texto: sai como número, sem apóstrofo", () => {
    expect(celulaParaTexto(-5)).toBe("-5");
    expect(celulaParaTexto(-0.5)).toBe("-0,5");
  });

  it("texto numérico em coluna numérica sai como número; em coluna de texto é neutralizado", () => {
    expect(celulaParaTexto("-5", { formato: "numero" })).toBe("-5");
    expect(celulaParaTexto("-5")).toBe("'-5");
  });
});

describe("números", () => {
  it("usam vírgula decimal e não têm separador de milhar", () => {
    expect(celulaParaTexto(12.5)).toBe("12,5");
    expect(celulaParaTexto(3)).toBe("3");
    expect(celulaParaTexto(1234567.89)).toBe("1234567,89");
    expect(celulaParaTexto(0)).toBe("0");
  });

  it("-0 sai como 0", () => {
    expect(celulaParaTexto(-0)).toBe("0");
    expect(celulaParaTexto(-0, { formato: "moeda" })).toBe("0,00");
  });

  it("moeda tem sempre duas casas", () => {
    expect(celulaParaTexto(1234.5, { formato: "moeda" })).toBe("1234,50");
    expect(celulaParaTexto(259, { formato: "moeda" })).toBe("259,00");
    expect(celulaParaTexto(0.1 + 0.2, { formato: "moeda" })).toBe("0,30");
    expect(celulaParaTexto(-12.345, { formato: "moeda" })).toBe("-12,35");
  });

  it("arredonda metade para cima mesmo quando o binário representa 1,005 como 1,00499...", () => {
    expect(celulaParaTexto(1.005, { formato: "moeda" })).toBe("1,01");
  });

  it("percentual tem uma casa", () => {
    expect(celulaParaTexto(33.333, { formato: "percentual" })).toBe("33,3");
    expect(celulaParaTexto(50, { formato: "percentual" })).toBe("50,0");
  });

  it("número com casas definidas", () => {
    expect(celulaParaTexto(2.5, { formato: "numero", decimais: 2 })).toBe("2,50");
    expect(celulaParaTexto(2.567, { formato: "numero", decimais: 1 })).toBe("2,6");
    expect(celulaParaTexto(7, { formato: "numero", decimais: 0 })).toBe("7");
  });

  it("texto numérico em coluna numérica ganha vírgula; texto livre não é alterado", () => {
    expect(celulaParaTexto("12.5", { formato: "numero" })).toBe("12,5");
    expect(celulaParaTexto("12,5", { formato: "moeda" })).toBe("12,50");
    expect(celulaParaTexto("abc", { formato: "moeda" })).toBe("abc");
    expect(celulaParaTexto("", { formato: "numero" })).toBe("");
  });

  it("NaN e Infinity viram célula vazia", () => {
    expect(celulaParaTexto(Number.NaN)).toBe("");
    expect(celulaParaTexto(Number.POSITIVE_INFINITY)).toBe("");
    expect(celulaParaTexto(Number.NEGATIVE_INFINITY, { formato: "moeda" })).toBe("");
  });

  it("números muito pequenos ou grandes não saem em notação científica", () => {
    expect(celulaParaTexto(1e-7)).toBe("0,0000001");
    expect(celulaParaTexto(1e21)).toBe("1000000000000000000000");
  });

  it("uma linha completa com números pt-BR", () => {
    const csv = gerarCsv<{ nome: string; valor: number; pct: number }>(
      [
        { titulo: "Aluno", chave: "nome" },
        { titulo: "Valor (R$)", chave: "valor", formato: "moeda" },
        { titulo: "Atraso (%)", chave: "pct", formato: "percentual" },
      ],
      [{ nome: "Ana", valor: 1299.9, pct: 12.34 }],
    );
    expect(csv).toBe(`${BOM}Aluno;Valor (R$);Atraso (%)\r\nAna;1299,90;12,3`);
  });
});

describe("outros tipos de célula", () => {
  it("null e undefined viram vazio", () => {
    expect(celulaParaTexto(null)).toBe("");
    expect(celulaParaTexto(undefined)).toBe("");
    expect(gerarCsv(colunasBasicas, [{ nome: "Ana", valor: null }])).toBe(
      `${BOM}Nome;Valor\r\nAna;`,
    );
  });

  it("booleano vira Sim/Não", () => {
    expect(celulaParaTexto(true)).toBe("Sim");
    expect(celulaParaTexto(false)).toBe("Não");
  });

  it("data AAAA-MM-DD vira dd/mm/aaaa", () => {
    expect(celulaParaTexto("2026-10-04", { formato: "data" })).toBe("04/10/2026");
    expect(celulaParaTexto("2026-01-31T10:00:00Z", { formato: "data" })).toBe("31/01/2026");
  });

  it("data inválida em coluna de data segue como texto (neutralizada se preciso)", () => {
    expect(celulaParaTexto("em breve", { formato: "data" })).toBe("em breve");
    expect(celulaParaTexto("=1+1", { formato: "data" })).toBe("'=1+1");
  });

  it("objeto Date vira dd/mm/aaaa pelo calendário local", () => {
    expect(celulaParaTexto(new Date(2026, 9, 4))).toBe("04/10/2026");
    expect(celulaParaTexto(new Date(2026, 0, 5))).toBe("05/01/2026");
    expect(celulaParaTexto(new Date(Number.NaN))).toBe("");
  });
});

describe("nomeArquivoCsv", () => {
  it("troca caracteres proibidos e espaços por hífen e garante .csv", () => {
    expect(nomeArquivoCsv("Relatório: Inadimplência/Out 2026")).toBe(
      "Relatório-Inadimplência-Out-2026.csv",
    );
  });

  it("não duplica a extensão, em qualquer caixa", () => {
    expect(nomeArquivoCsv("alunos.csv")).toBe("alunos.csv");
    expect(nomeArquivoCsv("alunos.CSV")).toBe("alunos.csv");
  });

  it("nome vazio ou só de símbolos cai no padrão", () => {
    expect(nomeArquivoCsv("")).toBe("relatorio.csv");
    expect(nomeArquivoCsv("///")).toBe("relatorio.csv");
  });

  it("não deixa subir diretórios", () => {
    expect(nomeArquivoCsv("../../etc/passwd")).toBe("etc-passwd.csv");
  });
});

describe("baixarCsv", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("não faz nada fora do navegador", () => {
    expect(baixarCsv("x", "a;b")).toBe(false);
  });

  it("cria o link, clica e libera a URL depois", async () => {
    vi.useFakeTimers();
    const link = {
      href: "",
      download: "",
      style: { display: "" },
      click: vi.fn(),
      remove: vi.fn(),
    };
    const anexar = vi.fn();
    vi.stubGlobal("document", { createElement: vi.fn(() => link), body: { appendChild: anexar } });
    const criar = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:teste");
    const revogar = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    const csv = gerarCsv(colunasBasicas, [{ nome: "Ação", valor: 1 }]);
    expect(baixarCsv("Relatório de teste", csv)).toBe(true);

    expect(link.href).toBe("blob:teste");
    expect(link.download).toBe("Relatório-de-teste.csv");
    expect(anexar).toHaveBeenCalledWith(link);
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(link.remove).toHaveBeenCalledTimes(1);

    const blob = criar.mock.calls[0]?.[0] as Blob;
    expect(blob.type).toBe("text/csv;charset=utf-8");
    // O BOM precisa chegar ao arquivo como os bytes EF BB BF.
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);

    expect(revogar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revogar).toHaveBeenCalledWith("blob:teste");
  });

  it("libera a URL e remove o link mesmo se o clique falhar", () => {
    vi.useFakeTimers();
    const link = {
      href: "",
      download: "",
      style: { display: "" },
      click: vi.fn(() => {
        throw new Error("bloqueado");
      }),
      remove: vi.fn(),
    };
    vi.stubGlobal("document", { createElement: () => link, body: { appendChild: vi.fn() } });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:falha");
    const revogar = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    expect(() => baixarCsv("x", "a")).toThrow("bloqueado");
    expect(link.remove).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(revogar).toHaveBeenCalledWith("blob:falha");
  });
});

describe("datas com horário e fuso", () => {
  const data = { formato: "data" } as const;

  it("instante em UTC sai com o dia de Brasília (01h30Z de 16/10 = 22h30 de 15/10)", () => {
    expect(celulaParaTexto("2026-10-16T01:30:00Z", data)).toBe("15/10/2026");
    expect(celulaParaTexto("2026-10-16T02:59:59.999Z", data)).toBe("15/10/2026");
    expect(celulaParaTexto("2026-10-16T03:00:00Z", data)).toBe("16/10/2026");
  });

  it("aceita o formato do Postgres e do PostgREST", () => {
    expect(celulaParaTexto("2026-10-16T01:30:00.123456+00:00", data)).toBe("15/10/2026");
    expect(celulaParaTexto("2026-10-16 01:30:00+00", data)).toBe("15/10/2026");
    expect(celulaParaTexto("2026-10-15T23:30:00-03:00", data)).toBe("15/10/2026");
    expect(celulaParaTexto("2026-10-15T23:30:00-0300", data)).toBe("15/10/2026");
  });

  it("data pura e horário sem fuso não mudam de dia", () => {
    expect(celulaParaTexto("2026-10-15", data)).toBe("15/10/2026");
    expect(celulaParaTexto("2026-10-15T23:30:00", data)).toBe("15/10/2026");
  });

  it("virada de ano e fevereiro bissexto", () => {
    expect(celulaParaTexto("2027-01-01T01:00:00Z", data)).toBe("31/12/2026");
    expect(celulaParaTexto("2028-03-01T02:00:00Z", data)).toBe("29/02/2028");
  });
});

describe("nomeArquivoCsv: nome longo", () => {
  it("limita o tamanho e não termina em hífen ou ponto", () => {
    const nome = nomeArquivoCsv(`relatorio ${"a".repeat(300)} final`);
    expect(nome.endsWith(".csv")).toBe(true);
    expect(nome.length).toBeLessThanOrEqual(124);
    expect(nome.replace(/\.csv$/, "")).not.toMatch(/[-.]$/);
    expect(nomeArquivoCsv(`${"a".repeat(119)}-b`)).toBe(`${"a".repeat(119)}.csv`);
  });
});

/** Leitor mínimo de CSV (RFC 4180 com ";"): devolve as linhas já sem as aspas de escape. */
function lerCsv(csv: string): string[][] {
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let aspas = false;
  const texto = csv.replace(/^\uFEFF/, "");
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i] as string;
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i += 1;
      } else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ";") {
      linha.push(campo);
      campo = "";
    } else if (c === "\r" && texto[i + 1] === "\n") {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
      i += 1;
    } else campo += c;
  }
  linha.push(campo);
  linhas.push(linha);
  return linhas;
}

describe("injeção de fórmula: varredura de combinações perigosas", () => {
  const alfabeto = ["=", "+", "-", "@", "\t", "\r", "\n", " ", "a", "1", ";", '"', "'", "|"];
  const textos: string[] = [""];
  let nivel: string[] = [""];
  for (let tamanho = 1; tamanho <= 4; tamanho++) {
    nivel = nivel.flatMap((prefixo) => alfabeto.map((c) => prefixo + c));
    textos.push(...nivel);
  }

  it("nenhuma célula de texto, lida de volta, começa como fórmula; e o conteúdo se preserva", () => {
    const perigosa = /^\s*[=+\-@]|^[\t\r]/;
    const csv = gerarCsv(
      [{ titulo: "Texto", chave: "t" }],
      textos.map((t) => ({ t })),
    );
    const lidas = lerCsv(csv).slice(1);
    expect(lidas).toHaveLength(textos.length);
    lidas.forEach((celulas, i) => {
      const original = textos[i] as string;
      const celula = celulas[0] as string;
      expect(celulas).toHaveLength(1);
      // Ou é inofensiva como veio, ou ganhou o apóstrofo na frente; o resto fica igual.
      if (perigosa.test(original)) expect(celula).toBe(`'${original}`);
      else expect(celula).toBe(original);
      // Em qualquer caso, lida de volta, a célula já não parece uma fórmula.
      expect(perigosa.test(celula)).toBe(false);
    });
  });
});
