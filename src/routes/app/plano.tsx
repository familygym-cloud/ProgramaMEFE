import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AjudaRecepcao } from "@/components/app/plano/AjudaRecepcao";
import { CartaoPlano } from "@/components/app/plano/CartaoPlano";
import {
  contratoDoAluno,
  encontrarPlanoCatalogo,
  sugestoesDePlanos,
} from "@/components/app/plano/catalogo";
import { Mensalidades } from "@/components/app/plano/Mensalidades";
import { resumirMensalidades } from "@/components/app/plano/mensalidades";
import { OutrosPlanos } from "@/components/app/plano/OutrosPlanos";
import { ProximoVencimento } from "@/components/app/plano/ProximoVencimento";
import { ValidadeTermo } from "@/components/app/plano/ValidadeTermo";
import { ValoresDoPlano } from "@/components/app/plano/ValoresDoPlano";
import { PageHeader } from "@/components/app/ui";
import { useAlunoApp } from "@/lib/aluno-app/store";

export const Route = createFileRoute("/app/plano")({
  head: () => ({ meta: [{ title: "Meu plano | Academia Family Gym" }] }),
  component: Pagina,
});

const SUGESTOES_VISIVEIS = 5;

function Pagina() {
  const { dados } = useAlunoApp();
  const { perfil, pagamentos } = dados;

  const plano = useMemo(() => encontrarPlanoCatalogo(perfil.plano), [perfil.plano]);
  const contrato = useMemo(() => contratoDoAluno(pagamentos, plano), [pagamentos, plano]);
  const resumo = useMemo(() => resumirMensalidades(pagamentos), [pagamentos]);
  const sugestoes = useMemo(() => sugestoesDePlanos(plano, SUGESTOES_VISIVEIS), [plano]);

  const termo = <ValidadeTermo termoValidoAte={perfil.termoValidoAte} />;

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="fg-entrada">
        <PageHeader
          eyebrow="Minha conta"
          titulo="Meu plano"
          descricao="Sua matrícula, as mensalidades e tudo o que o seu plano inclui, em um só lugar."
        />
      </div>

      {/* Celular: um bloco por vez, na ordem de importância. Tablet: duas colunas. Desktop largo: cartão e valores à esquerda, vencimento e avisos à direita. */}
      <div className="flex flex-col gap-5 md:grid md:grid-cols-2 xl:grid-cols-3 xl:items-start">
        <div className="contents xl:col-span-2 xl:flex xl:flex-col xl:gap-5">
          <div className="fg-entrada order-1 md:col-span-2" style={{ animationDelay: "80ms" }}>
            <CartaoPlano perfil={perfil} plano={plano} contrato={contrato} />
          </div>
          {plano ? (
            <div className="fg-entrada order-3 md:col-span-2" style={{ animationDelay: "200ms" }}>
              <ValoresDoPlano plano={plano} contrato={contrato} />
            </div>
          ) : (
            <div
              className="fg-entrada order-3 grid gap-5 sm:grid-cols-2 md:col-span-2"
              style={{ animationDelay: "200ms" }}
            >
              {termo}
              <AjudaRecepcao />
            </div>
          )}
        </div>
        <div className="contents xl:flex xl:flex-col xl:gap-5">
          <div className="fg-entrada order-2 md:col-span-2" style={{ animationDelay: "140ms" }}>
            <ProximoVencimento resumo={resumo} />
          </div>
          {plano ? (
            <>
              <div
                className="fg-entrada order-4 flex flex-col *:flex-1"
                style={{ animationDelay: "260ms" }}
              >
                {termo}
              </div>
              <div
                className="fg-entrada order-5 flex flex-col *:flex-1"
                style={{ animationDelay: "320ms" }}
              >
                <AjudaRecepcao />
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="fg-entrada" style={{ animationDelay: "340ms" }}>
        <Mensalidades pagamentos={pagamentos} resumo={resumo} />
      </div>

      <div className="fg-entrada" style={{ animationDelay: "400ms" }}>
        <OutrosPlanos sugestoes={sugestoes} />
      </div>
    </div>
  );
}
