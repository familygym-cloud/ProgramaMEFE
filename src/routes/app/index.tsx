import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartPulse, Plus, Scale, Timer, TrendingDown, TrendingUp } from "lucide-react";
import { CartaoPagamento, FaixaPagamento } from "@/components/app/inicio/AvisoPagamento";
import { EscalaIMC, MiniBarras, MiniLinha } from "@/components/app/inicio/MiniGraficos";
import { NivelAluno } from "@/components/app/inicio/NivelAluno";
import { ProgressoDoMes } from "@/components/app/inicio/ProgressoDoMes";
import { ProximaAula } from "@/components/app/inicio/ProximaAula";
import { RegistrarTreinoDialog } from "@/components/app/inicio/RegistrarTreinoDialog";
import { resumirPagamento } from "@/components/app/inicio/resumoPagamento";
import { SequenciaSemana } from "@/components/app/inicio/SequenciaSemana";
import { TreinoDeHoje } from "@/components/app/inicio/TreinoDeHoje";
import { UltimasConquistas } from "@/components/app/inicio/UltimasConquistas";
import { formatarVariacao } from "@/components/app/resultados/dados";
import { PageHeader, Selo, StatCard } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import {
  META_MENSAL_PADRAO,
  classificarIMC,
  conquistas,
  formatarDataLonga,
  hojeISO,
  mapaDeCalor,
  maiorSequencia,
  minutosNoMes,
  ordenarAvaliacoes,
  primeiroNome,
  proximaAulaReservada,
  resumoPeso,
  resumoTreino,
  saudacao,
  semanaAtual,
  sequenciaDias,
  treinoDeHoje,
  treinosNoMes,
} from "@/lib/aluno-app/derive";
import { useAlunoApp } from "@/lib/aluno-app/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Início | Academia Family Gym" }] }),
  component: Pagina,
});

/** Entrada escalonada: cada bloco sobe um pouco depois do anterior (desligada com movimento reduzido). */
function Entrada({
  atraso = 0,
  className,
  children,
}: {
  atraso?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("fg-entrada min-w-0", className)} style={{ animationDelay: `${atraso}ms` }}>
      {children}
    </div>
  );
}

function VariacaoPeso({ variacao, avaliacoes }: { variacao: number; avaliacoes: number }) {
  if (avaliacoes < 2) return <span>Primeira avaliação registrada</span>;
  if (variacao === 0) return <span>Sem variação desde a 1ª avaliação</span>;
  const Icone = variacao < 0 ? TrendingDown : TrendingUp;
  return (
    <span className="inline-flex items-center gap-1">
      <Icone className="size-3.5 shrink-0" aria-hidden />
      {formatarVariacao(variacao)} kg desde a 1ª avaliação
    </span>
  );
}

function Pagina() {
  const { dados } = useAlunoApp();
  const [registrando, setRegistrando] = useState(false);

  const resumo = useMemo(() => {
    const hoje = hojeISO();
    const { checkIns } = dados;
    const treino = treinoDeHoje(dados.treinos, hoje);
    const metaFrequencia = dados.metas.find((m) => m.tipo === "frequencia" && !m.concluida);
    return {
      sequencia: sequenciaDias(checkIns, hoje),
      melhorSequencia: maiorSequencia(checkIns),
      semana: semanaAtual(checkIns, hoje),
      // O mapa inclui a semana atual na última coluna; aqui interessam só as três anteriores.
      anteriores: mapaDeCalor(checkIns, 4, hoje).slice(0, 3),
      checkInsHoje: checkIns.filter((c) => c.data === hoje),
      treinosMes: treinosNoMes(checkIns, hoje),
      minutosMes: minutosNoMes(checkIns, hoje),
      totalTreinos: new Set(checkIns.map((c) => c.data)).size,
      meta: metaFrequencia?.alvo ?? META_MENSAL_PADRAO,
      metaPropria: metaFrequencia !== undefined,
      treino,
      minutosTreino: treino ? resumoTreino(treino).minutos : undefined,
      peso: resumoPeso(dados.avaliacoes),
      pesos: ordenarAvaliacoes(dados.avaliacoes).map((a) => a.peso),
      aula: proximaAulaReservada(dados.agenda),
      pagamento: resumirPagamento(dados.pagamentos),
      conquistas: conquistas(dados, hoje),
      dataLonga: formatarDataLonga(hoje),
    };
  }, [dados]);

  const nome = primeiroNome(dados.perfil.nome);
  const treinouHoje = resumo.checkInsHoje.length > 0;
  const imc = resumo.peso ? classificarIMC(resumo.peso.imcAtual) : null;
  const pagamentoUrgente = resumo.pagamento?.urgente ? resumo.pagamento : null;
  const mostrarCartaoPagamento = pagamentoUrgente === null;

  const descricao = treinouHoje
    ? "Treino do dia concluído. Agora é recuperar com carinho."
    : resumo.sequencia > 0
      ? `Você está há ${resumo.sequencia} ${resumo.sequencia === 1 ? "dia" : "dias"} em sequência. Vamos manter?`
      : "Cada treino conta. Que tal começar hoje?";

  return (
    <div className="space-y-6 lg:space-y-8">
      <Entrada>
        <PageHeader
          eyebrow={resumo.dataLonga}
          titulo={`${saudacao()}, ${nome}.`}
          descricao={descricao}
          acao={
            <Button
              type="button"
              variant="outline"
              onClick={() => setRegistrando(true)}
              className="h-11 rounded-full border-foreground/20 bg-transparent px-5 hover:bg-foreground/10"
            >
              <Plus aria-hidden />
              Registrar treino
            </Button>
          }
        />
      </Entrada>

      {pagamentoUrgente ? (
        <Entrada atraso={40}>
          <FaixaPagamento resumo={pagamentoUrgente} />
        </Entrada>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <Entrada atraso={60} className="lg:col-span-8">
          <TreinoDeHoje
            treino={resumo.treino}
            temFicha={dados.treinos.length > 0}
            checkInsHoje={resumo.checkInsHoje}
            sequencia={resumo.sequencia}
            primeiroNome={nome}
            aoRegistrar={() => setRegistrando(true)}
          />
        </Entrada>
        <Entrada atraso={120} className="lg:col-span-4">
          <SequenciaSemana
            className="h-full"
            sequencia={resumo.sequencia}
            melhorSequencia={resumo.melhorSequencia}
            semana={resumo.semana}
            anteriores={resumo.anteriores}
          />
        </Entrada>

        <Entrada atraso={180} className="lg:col-span-4">
          <ProgressoDoMes
            className="h-full"
            treinos={resumo.treinosMes}
            meta={resumo.meta}
            metaPropria={resumo.metaPropria}
          />
        </Entrada>
        <div className="grid grid-cols-2 gap-4 lg:col-span-8 lg:gap-5">
          <Entrada atraso={220}>
            <StatCard
              className="h-full"
              rotulo="Minutos no mês"
              valor={resumo.minutosMes}
              icone={<Timer aria-hidden />}
              detalhe={
                <div className="space-y-3">
                  <p>
                    {resumo.treinosMes} {resumo.treinosMes === 1 ? "dia" : "dias"} de treino
                  </p>
                  <MiniBarras
                    valores={resumo.semana.map((d) => d.minutos)}
                    destaque={resumo.semana.findIndex((d) => d.hoje)}
                    rotulo="Minutos treinados em cada dia da semana"
                  />
                </div>
              }
            />
          </Entrada>
          <Entrada atraso={260}>
            {resumo.peso ? (
              <StatCard
                className="h-full"
                rotulo="Peso atual"
                valor={resumo.peso.atual}
                casas={1}
                sufixo="kg"
                icone={<Scale aria-hidden />}
                detalhe={
                  <div className="space-y-3">
                    <p>
                      <VariacaoPeso
                        variacao={resumo.peso.variacao}
                        avaliacoes={dados.avaliacoes.length}
                      />
                    </p>
                    {resumo.pesos.length > 1 ? (
                      <MiniLinha valores={resumo.pesos} rotulo="Evolução do peso nas avaliações" />
                    ) : null}
                  </div>
                }
              />
            ) : (
              <StatCard
                className="h-full"
                rotulo="Peso atual"
                valor="—"
                icone={<Scale aria-hidden />}
                detalhe={
                  <Link to="/app/avaliacoes" className="underline underline-offset-2">
                    Ver avaliações
                  </Link>
                }
              />
            )}
          </Entrada>
          <Entrada atraso={300}>
            {resumo.peso && imc ? (
              <StatCard
                className="h-full"
                rotulo="IMC"
                valor={resumo.peso.imcAtual}
                casas={1}
                icone={<HeartPulse aria-hidden />}
                detalhe={
                  <div className="space-y-3">
                    <Selo tom={imc.tom}>{imc.rotulo}</Selo>
                    <EscalaIMC imc={resumo.peso.imcAtual} />
                  </div>
                }
              />
            ) : (
              <StatCard
                className="h-full"
                rotulo="IMC"
                valor="—"
                icone={<HeartPulse aria-hidden />}
                detalhe="Aparece após a primeira avaliação"
              />
            )}
          </Entrada>
          <Entrada atraso={340}>
            <NivelAluno className="h-full" totalTreinos={resumo.totalTreinos} />
          </Entrada>
        </div>

        <div
          className={cn(
            "grid gap-4 lg:col-span-12 lg:gap-5",
            mostrarCartaoPagamento ? "lg:grid-cols-3" : "lg:grid-cols-2",
          )}
        >
          <Entrada atraso={380}>
            <ProximaAula className="h-full" aula={resumo.aula} />
          </Entrada>
          <Entrada atraso={420}>
            <UltimasConquistas className="h-full" conquistas={resumo.conquistas} />
          </Entrada>
          {mostrarCartaoPagamento ? (
            <Entrada atraso={460}>
              <CartaoPagamento
                className="h-full"
                resumo={resumo.pagamento}
                plano={dados.perfil.plano}
                pagamentos={dados.pagamentos}
              />
            </Entrada>
          ) : null}
        </div>
      </div>

      <RegistrarTreinoDialog
        aberto={registrando}
        aoMudar={setRegistrando}
        sugestaoMin={resumo.minutosTreino}
      />
    </div>
  );
}
