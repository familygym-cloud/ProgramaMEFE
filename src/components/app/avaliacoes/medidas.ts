import type { MedidaCorporal } from "@/lib/aluno-app/types";
import { arredondar, mesCurto, rotulosEixo } from "./avaliacoes";

type ChaveMedida = Exclude<keyof MedidaCorporal, "id" | "data" | "observacoes">;

type DefinicaoMedida = {
  chave: ChaveMedida;
  rotulo: string;
  unidade: string;
  /** Sentido da mudança que costuma indicar evolução; null quando depende do objetivo de cada pessoa. */
  melhor: "menos" | "mais" | null;
};

const CATALOGO_MEDIDAS: DefinicaoMedida[] = [
  { chave: "gorduraPct", rotulo: "Gordura corporal", unidade: "%", melhor: "menos" },
  { chave: "massaMagraKg", rotulo: "Massa magra", unidade: "kg", melhor: "mais" },
  { chave: "cinturaCm", rotulo: "Cintura", unidade: "cm", melhor: "menos" },
  { chave: "quadrilCm", rotulo: "Quadril", unidade: "cm", melhor: null },
  { chave: "peitoCm", rotulo: "Peito", unidade: "cm", melhor: null },
  { chave: "bracoCm", rotulo: "Braço", unidade: "cm", melhor: null },
  { chave: "coxaCm", rotulo: "Coxa", unidade: "cm", melhor: null },
];

export type ItemMedida = DefinicaoMedida & {
  atual: number;
  /** Mudança desde a primeira medição que tinha este item; null quando só há um registro. */
  variacao: number | null;
  /** Valores registrados, do mais antigo para o mais recente. */
  serie: number[];
};

export function ordenarMedidas(medidas: MedidaCorporal[]): MedidaCorporal[] {
  return [...medidas].sort((a, b) => a.data.localeCompare(b.data));
}

/** Valor mais recente de cada item e quanto mudou desde o primeiro registro que o trouxe. */
export function resumirMedidas(medidas: MedidaCorporal[]): ItemMedida[] {
  const ordenadas = ordenarMedidas(medidas);
  const itens: ItemMedida[] = [];
  for (const def of CATALOGO_MEDIDAS) {
    const serie = ordenadas.map((m) => m[def.chave]).filter((v): v is number => v !== null);
    const atual = serie[serie.length - 1];
    const inicial = serie[0];
    if (atual === undefined || inicial === undefined) continue;
    itens.push({
      ...def,
      atual,
      serie,
      variacao: serie.length > 1 ? arredondar(atual - inicial) : null,
    });
  }
  return itens;
}

/** Pontos do gráfico cintura x quadril; só entram registros que tenham ao menos uma das duas. */
export function serieCircunferencias(medidas: MedidaCorporal[]) {
  const registros = ordenarMedidas(medidas).filter(
    (m) => m.cinturaCm !== null || m.quadrilCm !== null,
  );
  const rotulos = rotulosEixo(registros.map((m) => ({ data: m.data, mes: mesCurto(m.data) })));
  return registros.map((m, i) => ({
    data: rotulos[i] ?? m.data,
    cintura: m.cinturaCm,
    quadril: m.quadrilCm,
  }));
}
