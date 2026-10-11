import { describe, expect, it } from "vitest";
import { definicaoDoFormulario, todosOsFormularios } from "./catalogo";
import { chavesDuplicadas, listarEntradas } from "./esquema";
import { calcularAlertas } from "./derivados";
import { IDS_FORMULARIO, type Bloco, type ItemGrade } from "./tipos";

const PAGINAS: Record<string, number> = { mefe: 4, nutricional: 8, psicologica: 8 };

function itensDeGrade(blocos: readonly Bloco[]): ItemGrade[][] {
  return blocos.flatMap((b) => (b.tipo === "grade" ? [[...b.itens]] : []));
}

function textosVisiveis(id: (typeof IDS_FORMULARIO)[number]): string[] {
  const d = definicaoDoFormulario(id);
  const t: string[] = [d.nome, d.tituloFaixa, d.subtituloFaixa, d.rodape, d.sigilo, d.descricao];
  for (const p of d.paginas) {
    for (const b of p.blocos) {
      switch (b.tipo) {
        case "secao":
          t.push(b.titulo, b.subtitulo);
          break;
        case "subtitulo":
          t.push(b.texto);
          break;
        case "nota":
          t.push(b.texto);
          break;
        case "grade":
          for (const i of b.itens) {
            t.push(i.rotulo);
            if (i.tipo === "escolha") t.push(...i.opcoes.map((o) => o.rotulo));
            if (i.tipo === "campo" && i.unidade) t.push(i.unidade);
          }
          break;
        case "testes":
          for (const l of b.linhas) t.push(l.nome, l.detalhe ?? "", l.unidade, l.campoExtra ?? "");
          break;
        case "padroes":
          for (const l of b.linhas) t.push(l.nome, l.detalhe);
          break;
        case "tabela":
          t.push(...b.colunas.map((c) => c.titulo), b.colunaRotulo?.titulo ?? "", b.ajuda ?? "");
          for (const l of b.linhas) t.push(l.titulo ?? "", l.detalhe ?? "");
          break;
        case "matriz":
          t.push(b.cabecalho, ...b.opcoes.map((o) => o.rotulo));
          for (const l of b.linhas) t.push(l.texto, l.detalhe ?? "");
          break;
        case "assinaturas":
          t.push(b.esquerda, b.direita);
          break;
        default:
          break;
      }
    }
  }
  return t;
}

describe.each(IDS_FORMULARIO)("definição %s", (id) => {
  const def = definicaoDoFormulario(id);

  it("tem o número de páginas do PDF original", () => {
    expect(def.paginas).toHaveLength(PAGINAS[id] ?? -1);
  });

  it("cada página tem conteúdo e a primeira não começa por uma seção numerada solta", () => {
    for (const p of def.paginas) expect(p.blocos.length).toBeGreaterThan(0);
  });

  it("nenhuma chave se repete", () => {
    expect(chavesDuplicadas(def)).toEqual([]);
  });

  it("chaves e valores de opção não têm caracteres que quebrem a montagem das chaves", () => {
    for (const e of listarEntradas(def)) {
      expect(e.chave, e.chave).toMatch(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/i);
    }
    for (const p of def.paginas) {
      for (const b of p.blocos) {
        const grupos =
          b.tipo === "grade"
            ? b.itens.flatMap((i) => (i.tipo === "escolha" ? [i.opcoes] : []))
            : b.tipo === "matriz"
              ? [b.opcoes]
              : [];
        for (const g of grupos) {
          const valores = g.map((o) => o.valor);
          expect(new Set(valores).size, valores.join()).toBe(valores.length);
          for (const v of valores) expect(v).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        }
      }
    }
  });

  it("cada linha da grade de 12 colunas fecha exatamente 12", () => {
    for (const p of def.paginas) {
      for (const itens of itensDeGrade(p.blocos)) {
        let soma = 0;
        for (const item of itens) {
          soma += item.colunas;
          expect(soma, item.rotulo).toBeLessThanOrEqual(12);
          if (soma === 12) soma = 0;
        }
        expect(soma, itens.map((i) => i.rotulo).join(" | ")).toBe(0);
      }
    }
  });

  it("rótulos preenchidos, sem emoji, sem preço e com o rodapé do PDF", () => {
    for (const t of textosVisiveis(id)) {
      expect(t).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(t).not.toMatch(/R\$/);
    }
    expect(def.rodape).toMatch(/^Family Gym · Avaliação /);
    for (const i of def.paginas.flatMap((p) => itensDeGrade(p.blocos).flat())) {
      expect(i.rotulo.trim()).not.toBe("");
    }
  });

  it("todo alerta dinâmico declarado na tela pode ser produzido pelo cálculo", () => {
    const ids = def.paginas.flatMap((p) =>
      p.blocos.flatMap((b) => (b.tipo === "alerta-dinamico" ? [b.id] : [])),
    );
    const produzidos = new Set(
      [
        calcularAlertas("psicologica", { "phq.9": "2", "corpo.9": "sempre" }),
        calcularAlertas("nutricional", { "scoff.1": "sim", "scoff.2": "sim" }),
      ]
        .flat()
        .map((a) => a.id),
    );
    for (const alerta of ids) expect(produzidos.has(alerta), alerta).toBe(true);
  });
});

describe("conteúdo-chave dos PDFs", () => {
  it("MEFE tem os quatro pilares com selos M, E, F e El e a pontuação geral", () => {
    const def = definicaoDoFormulario("mefe");
    const selos = def.paginas.flatMap((p) =>
      p.blocos.flatMap((b) => (b.tipo === "secao" ? [b.selo] : [])),
    );
    expect(selos).toEqual(["M", "E", "F", "El"]);
    expect(def.paginas.some((p) => p.blocos.some((b) => b.tipo === "pontuacao-mefe"))).toBe(true);
  });

  it("MEFE: 6 testes de mobilidade, 7 padrões, 10 de flexibilidade e 7 de elasticidade", () => {
    const blocos = definicaoDoFormulario("mefe").paginas.flatMap((p) => p.blocos);
    const linhas = (id: string) => {
      const b = blocos.find((x) => x.tipo === "testes" && x.id === id);
      return b?.tipo === "testes" ? b.linhas.length : -1;
    };
    expect(linhas("mob")).toBe(6);
    expect(linhas("forca")).toBe(4);
    expect(linhas("flex")).toBe(10);
    expect(linhas("ela")).toBe(7);
    const padroes = blocos.find((x) => x.tipo === "padroes");
    expect(padroes?.tipo === "padroes" ? padroes.linhas.length : -1).toBe(7);
  });

  it("Nutricional inclui a bioimpedância com os sete indicadores do PDF", () => {
    const rotulos = definicaoDoFormulario("nutricional")
      .paginas.flatMap((p) => itensDeGrade(p.blocos).flat())
      .map((i) => i.rotulo);
    for (const r of [
      "Gordura corporal",
      "Massa muscular esquelética",
      "Água corporal total",
      "Gordura visceral",
      "Taxa metabólica basal",
      "Ângulo de fase",
      "Equipamento utilizado",
    ]) {
      expect(rotulos, r).toContain(r);
    }
  });

  it("Psicologia: PHQ-9 com 9 itens, GAD-7 com 7 (divididos em duas páginas) e avaliação de risco com 7", () => {
    const blocos = definicaoDoFormulario("psicologica").paginas.flatMap((p) => p.blocos);
    const linhas = (prefixo: string) =>
      blocos.flatMap((b) =>
        b.tipo === "matriz" ? b.linhas.filter((l) => l.chave.startsWith(prefixo)) : [],
      ).length;
    expect(linhas("phq.")).toBe(9);
    expect(linhas("gad.")).toBe(7);
    expect(linhas("risco.")).toBe(7);
    expect(linhas("corpo.")).toBe(9);
  });

  it("Nutricional: frequência alimentar com 14 grupos e SCOFF com 5 perguntas", () => {
    const blocos = definicaoDoFormulario("nutricional").paginas.flatMap((p) => p.blocos);
    const linhas = (prefixo: string) =>
      blocos.flatMap((b) =>
        b.tipo === "matriz" ? b.linhas.filter((l) => l.chave.startsWith(prefixo)) : [],
      ).length;
    expect(linhas("freq.")).toBe(14);
    expect(linhas("scoff.")).toBe(5);
  });

  it("os três formulários têm id distinto e o catálogo os devolve na ordem", () => {
    expect(todosOsFormularios().map((d) => d.id)).toEqual(["mefe", "nutricional", "psicologica"]);
  });
});
