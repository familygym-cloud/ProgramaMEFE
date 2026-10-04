import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Info } from "lucide-react";
import {
  aulasDoDia,
  diaInicial,
  diasDaFaixa,
  filtrarPorModalidade,
  modalidadesDaAgenda,
  proximoDiaComAulas,
} from "@/components/app/aulas/agenda";
import { DiaDaAgenda } from "@/components/app/aulas/DiaDaAgenda";
import { FiltroModalidade } from "@/components/app/aulas/FiltroModalidade";
import { MinhasReservas } from "@/components/app/aulas/MinhasReservas";
import { SeletorDeDia } from "@/components/app/aulas/SeletorDeDia";
import { useAgora } from "@/components/app/aulas/useAgora";
import { useReservaAula } from "@/components/app/aulas/useReservaAula";
import { EstadoVazio, PageHeader } from "@/components/app/ui";
import { aulasFuturas, paraISO } from "@/lib/aluno-app/derive";
import { useAlunoApp } from "@/lib/aluno-app/store";

export const Route = createFileRoute("/app/aulas")({
  head: () => ({ meta: [{ title: "Aulas | Academia Family Gym" }] }),
  component: Pagina,
});

function descricaoDaPagina(total: number, reservas: number, podeReservar: boolean): string {
  if (total === 0) return "Treine com a turma: aulas coletivas para todas as idades e níveis.";
  const aulas = `${total} ${total === 1 ? "aula" : "aulas"} nos próximos dias`;
  if (!podeReservar) return `${aulas}. Escolha o dia e veja os horários.`;
  return reservas > 0
    ? `${aulas} e ${reservas} ${reservas === 1 ? "reserva sua" : "reservas suas"}. Treinar com a turma é mais leve.`
    : `${aulas}. Escolha o dia, reserve sua vaga e venha treinar com a turma.`;
}

function AvisoSomenteLeitura() {
  return (
    <p
      role="note"
      className="flex items-start gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.04] px-4 py-3 text-sm text-muted-foreground"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden />
      <span>
        A reserva de vagas pelo app ainda não está disponível. Consulte a agenda por aqui e garanta
        o seu lugar com a recepção.
      </span>
    </p>
  );
}

function Pagina() {
  const { dados } = useAlunoApp();
  const agora = useAgora();
  const { pendentes, alternar } = useReservaAula();
  const podeReservar = dados.modulos.reservas;
  const hoje = paraISO(agora);

  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null);
  const [modalidade, setModalidade] = useState<string | null>(null);

  const futuras = useMemo(() => aulasFuturas(dados.agenda, agora), [dados.agenda, agora]);
  const modalidades = useMemo(() => modalidadesDaAgenda(futuras), [futuras]);
  const visiveis = useMemo(() => filtrarPorModalidade(futuras, modalidade), [futuras, modalidade]);
  const dias = useMemo(() => diasDaFaixa(futuras, visiveis, hoje), [futuras, visiveis, hoje]);
  const reservas = useMemo(
    () => (podeReservar ? futuras.filter((a) => a.reservada) : []),
    [futuras, podeReservar],
  );

  const dia =
    diaEscolhido && dias.some((d) => d.data === diaEscolhido)
      ? diaEscolhido
      : diaInicial(dias, hoje);

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="fg-entrada">
        <PageHeader
          eyebrow="Agenda"
          titulo="Aulas"
          descricao={descricaoDaPagina(futuras.length, reservas.length, podeReservar)}
        />
      </div>

      {!podeReservar ? <AvisoSomenteLeitura /> : null}

      {futuras.length === 0 ? (
        <EstadoVazio
          icone={<CalendarClock />}
          titulo="A agenda está sendo preparada"
          texto="Ainda não há aulas publicadas para os próximos dias. Volte em breve ou pergunte na recepção quais turmas estão abertas."
        />
      ) : (
        <>
          {podeReservar ? (
            <div className="fg-entrada" style={{ animationDelay: "80ms" }}>
              <MinhasReservas
                reservas={reservas}
                hoje={hoje}
                agora={agora}
                pendentes={pendentes}
                onAlternar={alternar}
              />
            </div>
          ) : null}

          <div className="space-y-5 fg-entrada" style={{ animationDelay: "160ms" }}>
            <SeletorDeDia
              dias={dias}
              selecionado={dia}
              hoje={hoje}
              onSelecionar={setDiaEscolhido}
            />
            <FiltroModalidade
              modalidades={modalidades}
              selecionada={modalidade}
              onSelecionar={setModalidade}
            />
          </div>

          <div className="fg-entrada" style={{ animationDelay: "240ms" }}>
            <DiaDaAgenda
              data={dia}
              hoje={hoje}
              agora={agora}
              aulas={aulasDoDia(visiveis, dia)}
              modalidade={modalidade}
              proximoDia={proximoDiaComAulas(visiveis, dia)}
              podeReservar={podeReservar}
              pendentes={pendentes}
              onAlternar={alternar}
              onIrParaDia={setDiaEscolhido}
              onLimparFiltro={() => setModalidade(null)}
            />
          </div>
        </>
      )}
    </div>
  );
}
