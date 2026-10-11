import { useMemo, useState } from "react";
import { ArrowRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Superficie } from "@/components/app/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Avaliacao, MedidaCorporal } from "@/lib/aluno-app/types";
import { dataCurta, formatarNumero, formatarVariacao } from "./avaliacoes";
import { compararInstantaneos, datasComparaveis, instantaneoEm } from "./comparar";
import { Rotulo } from "./Rotulo";

function valor(v: number | null, casas: number, unidade: string): string {
  return v === null ? "—" : `${formatarNumero(v, casas)}${unidade ? ` ${unidade}` : ""}`;
}

function SeletorDeData({
  id,
  rotulo,
  valorAtual,
  datas,
  aoMudar,
}: {
  id: string;
  rotulo: string;
  valorAtual: string;
  datas: string[];
  aoMudar: (data: string) => void;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      <label htmlFor={id}>
        <Rotulo>{rotulo}</Rotulo>
      </label>
      <Select value={valorAtual} onValueChange={aoMudar}>
        <SelectTrigger id={id} className="min-h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {datas.map((d) => (
            <SelectItem key={d} value={d}>
              {dataCurta(d)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Compara dois dias lado a lado: peso, IMC e, quando houver, bioimpedância e medidas. Mostra só a
 * diferença, sem julgar se é "bom" ou "ruim": o que importa depende do objetivo de cada pessoa e o
 * professor ajuda a interpretar.
 */
export function ComparativoAvaliacoes({
  avaliacoes,
  medidas,
}: {
  avaliacoes: Avaliacao[];
  medidas: MedidaCorporal[];
}) {
  const datas = useMemo(() => datasComparaveis(avaliacoes, medidas), [avaliacoes, medidas]);
  const [antesEscolhida, setAntes] = useState<string | undefined>(undefined);
  const [depoisEscolhida, setDepois] = useState<string | undefined>(undefined);

  if (datas.length < 2) return null;
  const depoisData =
    depoisEscolhida && datas.includes(depoisEscolhida) ? depoisEscolhida : datas[0]!;
  const antesData =
    antesEscolhida && datas.includes(antesEscolhida) ? antesEscolhida : datas[datas.length - 1]!;

  const linhas = compararInstantaneos(
    instantaneoEm(antesData, avaliacoes, medidas),
    instantaneoEm(depoisData, avaliacoes, medidas),
  );

  return (
    <Superficie className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold">Compare dois momentos</h2>
        <p className="text-sm text-muted-foreground">
          Escolha duas datas e veja o que mudou no seu corpo entre elas.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SeletorDeData
          id="comparar-antes"
          rotulo="Antes"
          valorAtual={antesData}
          datas={datas}
          aoMudar={setAntes}
        />
        <ArrowRight
          aria-hidden
          className="hidden size-5 shrink-0 text-muted-foreground sm:mb-3 sm:block"
        />
        <SeletorDeData
          id="comparar-depois"
          rotulo="Depois"
          valorAtual={depoisData}
          datas={datas}
          aoMudar={setDepois}
        />
      </div>

      {antesData === depoisData ? (
        <p className="text-sm text-muted-foreground">
          Escolha duas datas diferentes para comparar.
        </p>
      ) : linhas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Não há medidas registradas nessas datas. Tente outras datas.
        </p>
      ) : (
        <div>
          <p className="sr-only">
            Comparação entre {dataCurta(antesData)} e {dataCurta(depoisData)}
          </p>
          <ul className="divide-y divide-foreground/10">
            {linhas.map((l) => {
              const Icone =
                l.diferenca === null || l.diferenca === 0
                  ? Minus
                  : l.diferenca < 0
                    ? TrendingDown
                    : TrendingUp;
              return (
                <li key={l.campo} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{l.rotulo}</p>
                    <p className="text-sm tabular-nums text-muted-foreground">
                      {valor(l.antes, l.casas, l.unidade)}
                      <span aria-hidden> → </span>
                      <span className="sr-only"> para </span>
                      <span className="text-foreground">{valor(l.depois, l.casas, l.unidade)}</span>
                    </p>
                  </div>
                  <p className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1.5 text-sm font-semibold tabular-nums">
                    <Icone aria-hidden className="size-3.5" />
                    {l.diferenca === null
                      ? "—"
                      : `${formatarVariacao(l.diferenca, l.casas)}${l.unidade ? ` ${l.unidade}` : ""}`}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Pesos e medidas variam com hidratação, horário e equipamento. Converse com seu professor
        para interpretar as mudanças de acordo com o seu objetivo.
      </p>
    </Superficie>
  );
}
