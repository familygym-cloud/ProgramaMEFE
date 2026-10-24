import { describe, expect, it } from "vitest";
import { definicaoDoFormulario } from "./catalogo";
import {
  caixa,
  caixaOpcional,
  comFolga,
  emColunas,
  linhasMatriz,
  multipla,
  opcoes,
  paraValor,
  reduzir,
  unica,
} from "./construtores";
import { IDS_FORMULARIO } from "./tipos";

describe("construtores", () => {
  it("paraValor tira acento, espaço e pontuação e nunca devolve ponto", () => {
    expect(paraValor("Diabetes / pré-diabetes")).toBe("diabetes-pre-diabetes");
    expect(paraValor("  Gestação / lactação  ")).toBe("gestacao-lactacao");
    expect(paraValor("Jackson & Pollock – 3 dobras")).toBe("jackson-pollock-3-dobras");
    expect(paraValor("Educação física (ajuste do treino)")).not.toContain(".");
    expect(paraValor("???")).toBe("");
  });

  it("opcoes aceita só o rótulo (valor gerado) ou o par [valor, rótulo]", () => {
    expect(opcoes("Não sabe", ["sim", "Sim"])).toEqual([
      { valor: "nao-sabe", rotulo: "Não sabe" },
      { valor: "sim", rotulo: "Sim" },
    ]);
  });

  it("linhasMatriz numera a partir do ponto de partida e guarda o detalhe", () => {
    expect(linhasMatriz("gad.", ["a", ["b", "detalhe"]], 3)).toEqual([
      { chave: "gad.3", texto: "a" },
      { chave: "gad.4", texto: "b", detalhe: "detalhe" },
    ]);
  });

  it("caixaOpcional é uma caixa de uma linha marcada como opcional (só vai ao papel se preenchida)", () => {
    const item = caixaOpcional("x", "Rótulo");
    expect(item).toMatchObject({ tipo: "longo", linhas: 1, pautado: false, opcional: true });
    expect(caixa("y", "Outro")).not.toHaveProperty("opcional");
  });

  it("reduzir marca só os rótulos pedidos e não altera os valores", () => {
    const base = opcoes("Curto", "Um rótulo bem comprido");
    const r = reduzir(base, "Um rótulo bem comprido", "Não existe");
    expect(r.map((o) => o.valor)).toEqual(base.map((o) => o.valor));
    expect(r[0]).not.toHaveProperty("reduzido");
    expect(r[1]).toMatchObject({ reduzido: true });
  });

  it("emColunas e comFolga só acrescentam a marca e mantêm o resto do item", () => {
    const item = unica("k", "Rótulo", 12, opcoes("A", "B"));
    expect(emColunas(item)).toEqual({ ...item, colunasIguais: true });
    expect(comFolga(item)).toEqual({ ...item, folga: true });
    const multi = multipla("m", "Rótulo", 12, opcoes("A", "B", "C"), 3);
    expect(comFolga(emColunas(multi))).toMatchObject({
      modo: "multipla",
      porLinha: 3,
      folga: true,
      colunasIguais: true,
    });
  });
});

describe("marcas de papel nas definições", () => {
  const todas = IDS_FORMULARIO.map((id) => definicaoDoFormulario(id));

  it("o único campo opcional (fora do PDF) é a descrição de outra alergia", () => {
    const opcionais = todas.flatMap((d) =>
      d.paginas.flatMap((p) =>
        p.blocos.flatMap((b) =>
          b.tipo === "grade"
            ? b.itens.flatMap((i) => (i.tipo === "longo" && i.opcional === true ? [i.chave] : []))
            : [],
        ),
      ),
    );
    expect(opcionais).toEqual(["alergiaOutra"]);
  });

  it("só a folha 2 da Avaliação MEFE é diagramada em modo denso", () => {
    const densas = todas.flatMap((d) =>
      d.paginas.flatMap((p, i) => (p.densa === true ? [`${d.id}:${i + 1}`] : [])),
    );
    expect(densas).toEqual(["mefe:2"]);
  });

  it("opções reduzidas existem de fato nos grupos (nenhum rótulo reduzido se perde)", () => {
    const reduzidas = todas.flatMap((d) =>
      d.paginas.flatMap((p) =>
        p.blocos.flatMap((b) =>
          b.tipo === "grade"
            ? b.itens.flatMap((i) =>
                i.tipo === "escolha" ? i.opcoes.filter((o) => o.reduzido === true) : [],
              )
            : [],
        ),
      ),
    );
    expect(reduzidas.map((o) => o.rotulo).sort()).toEqual(
      [
        "Desemprego / dificuldade financeira",
        "Toda a equipe Family Gym",
        "Toda a equipe Family Gym",
        "Vergonha / desconforto no ambiente",
      ].sort(),
    );
  });
});
