import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ruler } from "lucide-react";
import { direcaoDesejadaPeso, montarHistorico } from "@/components/app/avaliacoes/avaliacoes";
import { Evolucao } from "@/components/app/avaliacoes/Evolucao";
import { HeroAvaliacao } from "@/components/app/avaliacoes/HeroAvaliacao";
import { HistoricoAvaliacoes } from "@/components/app/avaliacoes/HistoricoAvaliacoes";
import { MedidasCorporais } from "@/components/app/avaliacoes/MedidasCorporais";
import { ProximaAvaliacao } from "@/components/app/avaliacoes/ProximaAvaliacao";
import { EstadoVazio, PageHeader } from "@/components/app/ui";
import { resumoPeso } from "@/lib/aluno-app/derive";
import { useAlunoApp } from "@/lib/aluno-app/store";

export const Route = createFileRoute("/app/avaliacoes")({
  head: () => ({ meta: [{ title: "Avaliações | Academia Family Gym" }] }),
  component: Pagina,
});

function Pagina() {
  const { dados } = useAlunoApp();
  const { avaliacoes, metas, medidas, modulos, perfil } = dados;

  const info = useMemo(
    () => ({
      resumo: resumoPeso(avaliacoes),
      historico: montarHistorico(avaliacoes),
      melhorPeso: direcaoDesejadaPeso(avaliacoes, metas),
    }),
    [avaliacoes, metas],
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="fg-entrada">
        <PageHeader
          eyebrow="Meu corpo"
          titulo="Avaliações físicas"
          descricao="Peso, IMC e medidas registrados a cada avaliação, para você enxergar o caminho que já percorreu."
        />
      </div>

      {info.resumo ? (
        <>
          <div className="fg-entrada" style={{ animationDelay: "80ms" }}>
            <HeroAvaliacao
              resumo={info.resumo}
              totalAvaliacoes={avaliacoes.length}
              alturaCm={perfil.altura}
              melhor={info.melhorPeso}
            />
          </div>

          <div className="fg-entrada" style={{ animationDelay: "140ms" }}>
            <Evolucao avaliacoes={avaliacoes} metas={metas} melhorPeso={info.melhorPeso} />
          </div>

          <div
            className="fg-entrada grid gap-4 lg:grid-cols-3 lg:items-stretch lg:gap-5"
            style={{ animationDelay: "200ms" }}
          >
            <div className="lg:col-span-2">
              <HistoricoAvaliacoes linhas={info.historico} melhorPeso={info.melhorPeso} />
            </div>
            <ProximaAvaliacao ultimaData={info.resumo.ultimaData} />
          </div>
        </>
      ) : (
        <div className="fg-entrada" style={{ animationDelay: "80ms" }}>
          <EstadoVazio
            icone={<Ruler />}
            titulo="Sua primeira avaliação está esperando por você"
            texto="Na avaliação física, a equipe da Family Gym registra seu peso e altura e, se fizer sentido, suas medidas. Fale com a recepção ou com o seu professor para agendar a sua."
          />
        </div>
      )}

      <div className="fg-entrada" style={{ animationDelay: "260ms" }}>
        <MedidasCorporais medidas={medidas} disponivel={modulos.medidas} />
      </div>
    </div>
  );
}
