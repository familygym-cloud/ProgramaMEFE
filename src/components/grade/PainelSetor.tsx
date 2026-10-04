import { useMemo, useState } from "react";
import { CalendarOff } from "lucide-react";
import { EstadoVazio, Eyebrow } from "@/components/app/ui";
import { BrandLogo } from "@/components/BrandLogo";
import { botaoMarca } from "@/components/site/botoes";
import {
  AVISOS_GRADE,
  DIAS_GRADE,
  INFO_SETORES,
  PERIODOS_AQUATICA,
  REFERENCIA_GRADE,
  ROTULOS_PERIODO,
  SALAS_GINASTICA,
  type DiaGrade,
  type PeriodoAquatica,
  type SalaGinastica,
  type SetorGrade,
} from "@/lib/grade/dados";
import {
  agruparPorDia,
  contarAulas,
  ehAula,
  filtrarItens,
  itensDoSetor,
  listarAtividades,
  listarHorarios,
  montarLinhasDaTabela,
  periodoAtual,
  proximaAula,
  proximoDiaComAulas,
} from "@/lib/grade/grade";
import { cn } from "@/lib/utils";
import { AvisosDoSetor } from "./AvisosDoSetor";
import { GrupoDeOpcoes, SeletorDeAtividade } from "./Controles";
import { ListaDoDia } from "./ListaDoDia";
import { ResumoDaGrade } from "./ResumoDaGrade";
import { SeletorDeDia } from "./SeletorDeDia";
import { TabelaSemanal } from "./TabelaSemanal";

export type VisaoGrade = "semana" | "dia";

type Props = {
  setor: SetorGrade;
  agora: Date | null;
  hoje: DiaGrade | null;
  dia: DiaGrade;
  onDia: (dia: DiaGrade) => void;
  visao: VisaoGrade;
  onVisao: (visao: VisaoGrade) => void;
};

const OPCOES_PERIODO = PERIODOS_AQUATICA.map((valor) => ({
  valor,
  rotulo: ROTULOS_PERIODO[valor],
}));
const OPCOES_SALA = [
  { valor: "", rotulo: "Todas" },
  ...SALAS_GINASTICA.map((sala) => ({ valor: sala, rotulo: sala })),
];
const OPCOES_VISAO = [
  { valor: "semana", rotulo: "Semana" },
  { valor: "dia", rotulo: "Um dia" },
];

/** Conteúdo de um setor: filtros, resumo, avisos e a grade (tabela no desktop, lista no celular). */
export function PainelSetor({ setor, agora, hoje, dia, onDia, visao, onVisao }: Props) {
  const info = INFO_SETORES[setor];
  const [periodoEscolhido, setPeriodoEscolhido] = useState<PeriodoAquatica | null>(null);
  const [sala, setSala] = useState<SalaGinastica | "">("");
  const [atividade, setAtividade] = useState("");

  // Na Aquática, abre no período em curso (manhã até 12h59, depois tarde).
  const periodo: PeriodoAquatica | undefined =
    setor === "aquatica"
      ? (periodoEscolhido ?? (agora ? periodoAtual(agora) : "manha"))
      : undefined;

  const base = useMemo(() => itensDoSetor(setor, periodo), [setor, periodo]);
  const aposSala = useMemo(() => (sala ? filtrarItens(base, { sala }) : base), [base, sala]);
  const atividades = useMemo(() => listarAtividades(aposSala), [aposSala]);
  const atividadeAtiva = atividades.includes(atividade) ? atividade : "";
  const itens = useMemo(
    () => filtrarItens(aposSala, { atividade: atividadeAtiva }),
    [aposSala, atividadeAtiva],
  );

  const porDia = useMemo(() => agruparPorDia(itens), [itens]);
  const totais = DIAS_GRADE.map((d) => ({ dia: d, total: contarAulas(porDia[d]) }));
  const linhas = useMemo(() => montarLinhasDaTabela(itens, setor === "ginastica"), [itens, setor]);
  const totalHorarios = listarHorarios(itens.filter(ehAula)).length;
  const filtrado = sala !== "" || atividadeAtiva !== "";

  const proxima = agora ? proximaAula(itens, agora) : null;
  const proximas = new Set(proxima && proxima.diasAte === 0 ? proxima.itens.map((i) => i.id) : []);

  function escolherSala(valor: string) {
    const nova = SALAS_GINASTICA.find((s) => s === valor) ?? "";
    setSala(nova);
    const disponiveis = listarAtividades(nova ? filtrarItens(base, { sala: nova }) : base);
    if (!disponiveis.includes(atividade)) setAtividade("");
  }

  function escolherPeriodo(valor: string) {
    const novo = PERIODOS_AQUATICA.find((p) => p === valor);
    if (!novo) return;
    setPeriodoEscolhido(novo);
    if (!listarAtividades(itensDoSetor(setor, novo)).includes(atividade)) setAtividade("");
  }

  function limparFiltros() {
    setSala("");
    setAtividade("");
  }

  const titulo = `Grade de horários · ${info.titulo}${periodo ? ` · ${ROTULOS_PERIODO[periodo]}` : ""}`;
  const legenda = `${titulo} · ${REFERENCIA_GRADE}`;
  const temDuracao = itens.some((item) => item.duracaoMin !== undefined);
  const temManutencao = itens.some((item) => item.tipo === "manutencao");
  const modoDia = visao === "dia";

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="hidden items-center justify-between border-b border-border pb-3 print:flex">
        <BrandLogo variante="principal" tom="preto" className="h-9" />
        <p className="text-sm font-semibold">Family Gym · {REFERENCIA_GRADE}</p>
      </div>

      <div className="space-y-2">
        <Eyebrow className="print:hidden">{REFERENCIA_GRADE}</Eyebrow>
        {/* Os separadores "·" ficam colados à palavra anterior: a quebra de linha no celular nunca
            começa uma linha com "·". O texto lido continua sendo `titulo`. */}
        <h2 className="block font-display text-2xl font-bold leading-tight sm:text-3xl">
          Grade de <span className="whitespace-nowrap">horários ·</span>{" "}
          {periodo ? (
            <>
              <span className="whitespace-nowrap">{info.titulo} ·</span> {ROTULOS_PERIODO[periodo]}
            </>
          ) : (
            info.titulo
          )}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base print:hidden">
          {info.descricao}
        </p>
      </div>

      <div className="flex flex-col gap-4 @xl:flex-row @xl:flex-wrap @xl:items-end print:hidden">
        {setor === "aquatica" && periodo ? (
          <GrupoDeOpcoes
            rotulo="Período"
            opcoes={OPCOES_PERIODO}
            valor={periodo}
            onChange={escolherPeriodo}
          />
        ) : null}
        {setor === "ginastica" ? (
          <GrupoDeOpcoes rotulo="Sala" opcoes={OPCOES_SALA} valor={sala} onChange={escolherSala} />
        ) : null}
        <SeletorDeAtividade
          atividades={atividades}
          valor={atividadeAtiva}
          onChange={setAtividade}
          className="@xl:w-64"
        />
        <GrupoDeOpcoes
          rotulo="Visualização"
          opcoes={OPCOES_VISAO}
          valor={visao}
          onChange={(valor) => onVisao(valor === "dia" ? "dia" : "semana")}
          className="hidden @4xl:flex @4xl:ml-auto"
        />
      </div>

      <ResumoDaGrade
        totalAulas={contarAulas(itens)}
        totalHorarios={totalHorarios}
        filtroAtividade={atividadeAtiva}
        agoraPronto={agora !== null}
        hojeEhDomingo={agora !== null && hoje === null}
        proxima={proxima}
      />

      <AvisosDoSetor avisos={AVISOS_GRADE[setor]} />

      {itens.length === 0 ? (
        <EstadoVazio
          icone={<CalendarOff />}
          titulo="Nenhuma aula encontrada"
          texto="Não há aulas com os filtros escolhidos."
          acao={
            <button type="button" onClick={limparFiltros} className={botaoMarca("secundario")}>
              Limpar filtros
            </button>
          }
        />
      ) : (
        <>
          <div
            className={cn(
              "space-y-5 print:hidden",
              modoDia ? "@4xl:mx-auto @4xl:max-w-2xl" : "@4xl:hidden",
            )}
          >
            <SeletorDeDia totais={totais} selecionado={dia} hoje={hoje} onSelecionar={onDia} />
            <div>
              <ListaDoDia
                dia={dia}
                itens={porDia[dia]}
                hoje={hoje}
                agora={agora}
                proximas={proximas}
                filtrado={filtrado}
                proximoDia={proximoDiaComAulas(itens, dia)}
                onIrParaDia={onDia}
                onLimparFiltros={limparFiltros}
              />
            </div>
          </div>

          <div className={cn("hidden print:block", !modoDia && "@4xl:block")}>
            <TabelaSemanal
              linhas={linhas}
              porSala={setor === "ginastica"}
              hoje={hoje}
              agora={agora}
              legenda={legenda}
            />
          </div>

          {temDuracao || temManutencao ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              {temDuracao ? (
                <p>Duração das aulas em minutos: 45&apos; significa 45 minutos.</p>
              ) : null}
              {temManutencao ? <p>Manutenção: horário sem aula.</p> : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
