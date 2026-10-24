import { useMemo, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AjudaRecepcao } from "@/components/app/plano/AjudaRecepcao";
import { CartaoPlano } from "@/components/app/plano/CartaoPlano";
import { contratoDoAluno, sugestoesDePlanos } from "@/components/app/plano/catalogo";
import { Mensalidades } from "@/components/app/plano/Mensalidades";
import { resumirMensalidades } from "@/components/app/plano/mensalidades";
import { OutrosPlanos } from "@/components/app/plano/OutrosPlanos";
import { ProximoVencimento } from "@/components/app/plano/ProximoVencimento";
import { ValidadeTermo } from "@/components/app/plano/ValidadeTermo";
import { ValoresDoPlano } from "@/components/app/plano/ValoresDoPlano";
import { ValoresIndisponiveis } from "@/components/app/plano/ValoresIndisponiveis";
import { PageHeader } from "@/components/app/ui";
import { useAlunoApp } from "@/lib/aluno-app/store";
import { usePrecosDosPlanos } from "@/lib/planos-hook";
import { encontrarPlano } from "@/lib/planos-info";

export const Route = createFileRoute("/app/plano")({
  head: () => ({ meta: [{ title: "Meu plano | Academia Family Gym" }] }),
  component: Pagina,
});

const SUGESTOES_VISIVEIS = 5;

function Pagina() {
  const { dados } = useAlunoApp();
  const { perfil, pagamentos } = dados;

  // Os valores vêm do banco e só chegam a quem tem plano ativo; sem eles, o resto da página funciona.
  const precos = usePrecosDosPlanos(dados.demo);
  const info = useMemo(() => encontrarPlano(perfil.plano), [perfil.plano]);
  const planos = useMemo(() => (precos.estado === "ok" ? precos.planos : []), [precos]);
  const plano = useMemo(() => planos.find((p) => p.slug === info?.slug), [planos, info]);
  const contrato = useMemo(() => contratoDoAluno(pagamentos, plano), [pagamentos, plano]);
  const resumo = useMemo(() => resumirMensalidades(pagamentos), [pagamentos]);
  const sugestoes = useMemo(
    () => sugestoesDePlanos(planos, info?.slug, SUGESTOES_VISIVEIS),
    [planos, info],
  );

  const termo = <ValidadeTermo termoValidoAte={perfil.termoValidoAte} />;

  // Bloco dos valores do plano: a tabela, um aviso de bloqueio ou nada (plano da ficha sem correspondência).
  let blocoValores: ReactNode = null;
  if (info) {
    if (precos.estado === "carregando") {
      blocoValores = (
        <div
          role="status"
          aria-label="Carregando os valores do plano"
          className="h-72 animate-pulse rounded-3xl border border-foreground/10 bg-card/60"
        />
      );
    } else if (plano) {
      blocoValores = <ValoresDoPlano plano={plano} contrato={contrato} />;
    } else if (precos.estado !== "ok") {
      blocoValores = <ValoresIndisponiveis precos={precos} />;
    }
  }

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
            <CartaoPlano perfil={perfil} plano={info} contrato={contrato} />
          </div>
          {blocoValores ? (
            <div className="fg-entrada order-3 md:col-span-2" style={{ animationDelay: "200ms" }}>
              {blocoValores}
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
          {blocoValores ? (
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

      {sugestoes.length > 0 ? (
        <div className="fg-entrada" style={{ animationDelay: "400ms" }}>
          <OutrosPlanos sugestoes={sugestoes} />
        </div>
      ) : null}
    </div>
  );
}
