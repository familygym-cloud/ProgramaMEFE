import { describe, expect, it, vi } from "vitest";
import { definicaoDoFormulario } from "./catalogo";
import {
  criarArmazem,
  exportarFormulario,
  importarFormulario,
  nomeDoArquivo,
  TAMANHO_MAXIMO_DO_ARQUIVO,
  VERSAO_DO_ESQUEMA,
} from "./estado";

const mefe = definicaoDoFormulario("mefe");
const nutri = definicaoDoFormulario("nutricional");
const psico = definicaoDoFormulario("psicologica");
const AGORA = new Date(2026, 9, 4, 9, 30);

const arquivo = (
  sobrescrever: Record<string, unknown> = {},
  valores: Record<string, unknown> = {},
) =>
  JSON.stringify({
    aplicacao: "family-gym-formulario",
    versao: 1,
    formulario: "mefe",
    exportadoEm: AGORA.toISOString(),
    valores,
    ...sobrescrever,
  });

describe("exportar", () => {
  it("guarda só o que foi preenchido, em ordem estável, e o formulário certo", () => {
    const texto = exportarFormulario(
      mefe,
      {
        peso: "72,5",
        nome: "Maria",
        sexo: "feminino",
        "plano.prioridade.mobilidade-articular": "1",
        altura: "",
      },
      AGORA,
    );
    const lido = JSON.parse(texto) as Record<string, unknown>;
    expect(lido).toMatchObject({
      aplicacao: "family-gym-formulario",
      versao: VERSAO_DO_ESQUEMA,
      formulario: "mefe",
    });
    expect(Object.keys(lido["valores"] as object)).toEqual([
      "nome",
      "peso",
      "plano.prioridade.mobilidade-articular",
      "sexo",
    ]);
  });
  it("mantém o vazio de um campo calculado (cálculo apagado de propósito)", () => {
    const lido = JSON.parse(exportarFormulario(nutri, { imc: "", altura: "" }, AGORA)) as {
      valores: Record<string, string>;
    };
    expect(lido.valores).toEqual({ imc: "" });
  });
  it("descarta chaves que não existem no formulário", () => {
    const lido = JSON.parse(exportarFormulario(mefe, { inventada: "x", nome: "A" }, AGORA)) as {
      valores: Record<string, string>;
    };
    expect(lido.valores).toEqual({ nome: "A" });
  });
  it("o nome do arquivo não leva o nome da pessoa", () => {
    const nome = nomeDoArquivo(nutri, AGORA);
    expect(nome).toBe("family-gym-nutricional-2026-10-04.json");
  });
});

describe("importar: ida e volta", () => {
  it("o que se exporta se importa igual", () => {
    const original = {
      nome: "Maria da Silva",
      nascimento: "1990-05-10",
      sexo: "feminino",
      "mob.ombro.d": "85",
      "mob.ombro.cls": "boa",
      "pad.agachamento.nota": "4",
      "plano.prioridade.prevencao-de-lesoes": "1",
      historico: "linha 1\nlinha 2 – acentuação ç ã é",
      "nota.geral": "",
    };
    const resultado = importarFormulario(exportarFormulario(mefe, original, AGORA), mefe);
    expect(resultado).toEqual({ ok: true, valores: original, ignorados: 0 });
  });
  it("funciona nos três formulários", () => {
    for (const def of [mefe, nutri, psico]) {
      const r = importarFormulario(exportarFormulario(def, { nome: "X" }, AGORA), def);
      expect(r).toEqual({ ok: true, valores: { nome: "X" }, ignorados: 0 });
    }
  });
});

describe("importar: arquivos malformados", () => {
  const erro = (texto: string, def = mefe) => {
    const r = importarFormulario(texto, def);
    expect(r.ok).toBe(false);
    return r.ok ? "" : r.erro;
  };

  it("vazio, só espaços e sem ser texto", () => {
    expect(erro("")).toMatch(/vazio/);
    expect(erro("   \n")).toMatch(/vazio/);
    expect(importarFormulario(undefined as unknown as string, mefe).ok).toBe(false);
  });
  it("não é JSON", () => {
    expect(erro("isto não é json")).toMatch(/JSON/);
    expect(erro("{ valores: ")).toMatch(/JSON/);
    expect(erro("{'a':1}")).toMatch(/JSON/);
  });
  it("JSON de outro formato", () => {
    for (const lixo of [
      "[]",
      "null",
      "42",
      '"texto"',
      "{}",
      '{"valores":{}}',
      '{"aplicacao":"outra","versao":1}',
    ]) {
      expect(erro(lixo)).toMatch(/formulário salvo pela Family Gym/);
    }
  });
  it("campos do envelope com tipo errado", () => {
    expect(erro(arquivo({ versao: "1" }))).toMatch(/Family Gym/);
    expect(erro(arquivo({ versao: 0 }))).toMatch(/Family Gym/);
    expect(erro(arquivo({ versao: 1.5 }))).toMatch(/Family Gym/);
    expect(erro(arquivo({ valores: [] }))).toMatch(/Family Gym/);
    expect(erro(arquivo({ valores: null }))).toMatch(/Family Gym/);
    expect(erro(arquivo({ formulario: 3 }))).toMatch(/Family Gym/);
  });
  it("versão mais nova que a conhecida", () => {
    expect(erro(arquivo({ versao: VERSAO_DO_ESQUEMA + 1 }))).toMatch(/versão mais nova/);
  });
  it("formulário desconhecido ou de outro tipo", () => {
    expect(erro(arquivo({ formulario: "financeiro" }))).toMatch(/não conhece/);
    expect(erro(arquivo({ formulario: "nutricional" }))).toMatch(/Avaliação Nutricional/);
    expect(erro(arquivo({ formulario: "psicologica" }))).toMatch(/Avaliação Psicológica/);
    expect(erro(arquivo({ formulario: "mefe" }), nutri)).toMatch(/Avaliação MEFE/);
  });
  it("arquivo grande demais", () => {
    expect(erro(" ".repeat(TAMANHO_MAXIMO_DO_ARQUIVO + 1) + "{}")).toMatch(/grande demais/);
  });
  it("campos demais", () => {
    const muitos = Object.fromEntries(Array.from({ length: 5001 }, (_, i) => [`k${i}`, "x"]));
    expect(erro(arquivo({}, muitos))).toMatch(/campos demais/);
  });
  it("a mensagem de erro nunca repete o conteúdo do arquivo", () => {
    const segredo = "SEGREDO-DO-PACIENTE";
    for (const texto of [segredo, `{"aplicacao":"${segredo}"}`, arquivo({ formulario: segredo })]) {
      expect(erro(texto)).not.toContain(segredo);
    }
  });
});

describe("importar: valores", () => {
  const ok = (valores: Record<string, unknown>, def = mefe) => {
    const r = importarFormulario(arquivo({ formulario: def.id }, valores), def);
    if (!r.ok) throw new Error(r.erro);
    return r;
  };

  it("descarta chaves desconhecidas e conta", () => {
    const r = ok({ nome: "A", desconhecida: "x", "outra.coisa": "y" });
    expect(r.valores).toEqual({ nome: "A" });
    expect(r.ignorados).toBe(2);
  });
  it("descarta valores que não são texto", () => {
    const r = ok({
      nome: 10,
      peso: null,
      altura: ["170"],
      objetivo: { a: 1 },
      email: true,
      telefone: "119",
    });
    expect(r.valores).toEqual({ telefone: "119" });
    expect(r.ignorados).toBe(5);
  });
  it("descarta opção que não existe e aceita as que existem", () => {
    const r = ok({
      sexo: "alienigena",
      lado: "direito",
      "mob.ombro.cls": "otima",
      "pad.puxar.nota": "6",
    });
    expect(r.valores).toEqual({ lado: "direito" });
    expect(r.ignorados).toBe(3);
  });
  it("marca de múltipla escolha só vale 1", () => {
    const r = ok({
      "plano.prioridade.mobilidade-articular": "0",
      "plano.prioridade.prevencao-de-lesoes": "1",
    });
    expect(r.valores).toEqual({ "plano.prioridade.prevencao-de-lesoes": "1" });
  });
  it("data precisa estar no formato ISO", () => {
    const r = ok({ nascimento: "10/05/1990", avaliacao: "2026-10-04" });
    expect(r.valores).toEqual({ avaliacao: "2026-10-04" });
  });
  it("respeita o limite de tamanho de cada campo", () => {
    expect(ok({ nome: "a".repeat(300) }).valores).toEqual({ nome: "a".repeat(300) });
    expect(ok({ nome: "a".repeat(301) }).ignorados).toBe(1);
    expect(ok({ "mob.obs": "a".repeat(8000) }).ignorados).toBe(0);
    expect(ok({ "mob.obs": "a".repeat(8001) }).ignorados).toBe(1);
  });
  it("vazio só é aceito em campo calculado", () => {
    expect(ok({ nome: "" }).valores).toEqual({});
    expect(ok({ nome: "" }).ignorados).toBe(1);
    expect(ok({ imc: "" }, nutri).valores).toEqual({ imc: "" });
  });
  it("chaves perigosas são só chaves desconhecidas", () => {
    const texto =
      '{"aplicacao":"family-gym-formulario","versao":1,"formulario":"mefe","valores":{"__proto__":"x","constructor":"y","prototype":"z","nome":"A"}}';
    const r = importarFormulario(texto, mefe);
    expect(r).toMatchObject({ ok: true, valores: { nome: "A" } });
    expect(({} as Record<string, unknown>)["x"]).toBeUndefined();
    expect(Object.getPrototypeOf(r.ok ? r.valores : {})).toBe(Object.prototype);
  });
  it("campos extras do envelope não atrapalham", () => {
    const r = importarFormulario(arquivo({ extra: { qualquer: 1 } }, { nome: "A" }), mefe);
    expect(r).toMatchObject({ ok: true, valores: { nome: "A" } });
  });
});

describe("armazém", () => {
  const novo = () => criarArmazem(nutri, () => new Date(2026, 9, 4, 12));

  it("guarda, lê e remove (vazio em campo comum apaga a chave)", () => {
    const a = novo();
    expect(a.obter("nome")).toBeUndefined();
    a.definir("nome", "Maria");
    expect(a.obter("nome")).toBe("Maria");
    a.definir("nome", "");
    expect(a.obter("nome")).toBeUndefined();
    expect(Object.keys(a.instantaneo())).toEqual([]);
  });
  it("campo calculado guarda o vazio e restaura o automático", () => {
    const a = novo();
    a.definir("pesoAtual", "70");
    a.definir("altura", "175");
    expect(a.derivados()["imc"]?.valor).toBe("22,9");
    a.definir("imc", "");
    expect(a.obter("imc")).toBe("");
    a.restaurar("imc");
    expect(a.obter("imc")).toBeUndefined();
    expect(a.derivados()["imc"]?.valor).toBe("22,9");
  });
  it("avisa os assinantes a cada mudança real, e só nelas", () => {
    const a = novo();
    const ouvinte = vi.fn();
    const cancelar = a.assinar(ouvinte);
    a.definir("nome", "A");
    a.definir("nome", "A");
    a.definir("nome", "B");
    expect(ouvinte).toHaveBeenCalledTimes(2);
    a.definir("outro", "");
    expect(ouvinte).toHaveBeenCalledTimes(2);
    cancelar();
    a.definir("nome", "C");
    expect(ouvinte).toHaveBeenCalledTimes(2);
  });
  it("o instantâneo é imutável e só muda quando o estado muda", () => {
    const a = novo();
    a.definir("nome", "A");
    const antes = a.instantaneo();
    expect(Object.isFrozen(antes)).toBe(true);
    expect(a.instantaneo()).toBe(antes);
    a.definir("nome", "B");
    expect(a.instantaneo()).not.toBe(antes);
    expect(antes["nome"]).toBe("A");
  });
  it("derivados e alertas são recalculados só quando o estado muda", () => {
    const a = novo();
    const d1 = a.derivados();
    expect(a.derivados()).toBe(d1);
    expect(a.alertas()).toBe(a.alertas());
    a.definir("scoff.1", "sim");
    a.definir("scoff.2", "sim");
    expect(a.derivados()).not.toBe(d1);
    expect(a.alertas().map((x) => x.id)).toEqual(["scoff"]);
  });
  it("sujo: só quando há conteúdo não salvo", () => {
    const a = novo();
    expect(a.sujo()).toBe(false);
    a.definir("nome", "A");
    expect(a.sujo()).toBe(true);
    a.marcarSalvo();
    expect(a.sujo()).toBe(false);
    a.definir("nome", "B");
    expect(a.sujo()).toBe(true);
    a.limpar();
    expect(a.sujo()).toBe(false);
    expect(a.instantaneo()).toEqual({});
  });
  it("marcar como salvo avisa quem observa o 'sujo' e não refaz os cálculos", () => {
    const a = novo();
    a.definir("nome", "A");
    const derivados = a.derivados();
    const ouvinte = vi.fn();
    a.assinar(ouvinte);
    a.marcarSalvo();
    expect(ouvinte).toHaveBeenCalledTimes(1);
    expect(a.sujo()).toBe(false);
    expect(a.derivados()).toBe(derivados);
    a.marcarSalvo();
    expect(ouvinte).toHaveBeenCalledTimes(1);
  });
  it("abrir um arquivo substitui tudo e deixa o formulário 'salvo'", () => {
    const a = novo();
    a.definir("nome", "antigo");
    a.substituir({ nome: "novo", crn: "123" });
    expect(a.instantaneo()).toEqual({ nome: "novo", crn: "123" });
    expect(a.sujo()).toBe(false);
    a.definir("crn", "456");
    expect(a.sujo()).toBe(true);
  });
  it("limpar um formulário vazio não faz barulho", () => {
    const a = novo();
    const ouvinte = vi.fn();
    a.assinar(ouvinte);
    a.limpar();
    a.restaurar("imc");
    expect(ouvinte).not.toHaveBeenCalled();
  });
});
