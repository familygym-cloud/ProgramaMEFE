import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { FlaskConical, RefreshCw, UsersRound } from "lucide-react";
import { EstadoVazio, Selo } from "@/components/app/ui";
import { BrandLogo } from "@/components/BrandLogo";
import { Alunos } from "@/components/relatorios/Alunos";
import { Financeiro } from "@/components/relatorios/Financeiro";
import { Frequencia } from "@/components/relatorios/Frequencia";
import { MenuImprimir, type EscopoImpressao } from "@/components/relatorios/MenuImprimir";
import { Saude } from "@/components/relatorios/Saude";
import { Termos } from "@/components/relatorios/Termos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { useImpressao } from "@/components/relatorios/useImpressao";
import { VisaoGeral } from "@/components/relatorios/VisaoGeral";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ABAS_RELATORIO,
  ROTULO_ABA,
  ehAba,
  type AbaRelatorio,
  type ModoRelatorio,
} from "@/lib/relatorios/abas";
import { ROTULO_DEMO } from "@/lib/relatorios/fixtures";
import { formatarDataExtensa } from "@/lib/relatorios/formatar";
import type { RelatorioGeral } from "@/lib/relatorios/types";
import { cn } from "@/lib/utils";

const FORMATO_HORA = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function ConteudoDaAba({ aba, relatorio, modo }: PropsAba & { aba: AbaRelatorio }) {
  switch (aba) {
    case "visao-geral":
      return <VisaoGeral relatorio={relatorio} modo={modo} />;
    case "financeiro":
      return <Financeiro relatorio={relatorio} modo={modo} />;
    case "frequencia":
      return <Frequencia relatorio={relatorio} modo={modo} />;
    case "saude":
      return <Saude relatorio={relatorio} modo={modo} />;
    case "termos":
      return <Termos relatorio={relatorio} modo={modo} />;
    case "alunos":
      return <Alunos relatorio={relatorio} modo={modo} />;
  }
}

/** Nome da seção: só leitores de tela veem na tela; no papel vira o título de cada folha. */
function TituloDaSecao({ aba }: { aba: AbaRelatorio }) {
  return (
    <h2 className="sr-only print:not-sr-only print:mb-3 print:font-display print:text-xl print:font-bold">
      {ROTULO_ABA[aba]}
    </h2>
  );
}

/** Aviso fixo (também impresso) de que os números abaixo são fictícios. */
function BannerDemonstracao() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-2xl border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-3 text-sm leading-relaxed"
    >
      <FlaskConical className="mt-0.5 size-5 shrink-0 text-brand-yellow" aria-hidden />
      <p>{ROTULO_DEMO}</p>
    </div>
  );
}

function Cabecalho({
  relatorio,
  modo,
  aba,
  atualizadoEm,
  aoAtualizar,
  atualizando,
  aoImprimir,
}: {
  relatorio: RelatorioGeral;
  modo: ModoRelatorio;
  aba: AbaRelatorio;
  atualizadoEm: number | undefined;
  aoAtualizar: (() => void) | undefined;
  atualizando: boolean;
  aoImprimir: (escopo: EscopoImpressao) => void;
}) {
  return (
    <header className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <BrandLogo variante="principal" tom="branco" className="h-9 print:hidden" />
        <BrandLogo variante="principal" tom="preto" className="hidden h-9 print:block" />
        {modo === "demo" ? <Selo tom="destaque">Demonstração</Selo> : null}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Central de relatórios
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Gerado em {formatarDataExtensa(relatorio.geradoEm)}
            {atualizadoEm !== undefined ? (
              <span className="print:hidden">
                {" "}
                · atualizado às {FORMATO_HORA.format(atualizadoEm)}
              </span>
            ) : null}
            {modo === "demo" ? " · dados fictícios" : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {aoAtualizar ? (
            <Button
              type="button"
              variant="outline"
              onClick={aoAtualizar}
              disabled={atualizando}
              className="h-11 gap-2 rounded-full border-white/20 bg-transparent px-5 hover:bg-white/10 hover:text-foreground"
            >
              <RefreshCw
                className={atualizando ? "animate-spin motion-reduce:animate-none" : ""}
                aria-hidden
              />
              {atualizando ? "Atualizando…" : "Atualizar"}
            </Button>
          ) : null}
          <MenuImprimir rotuloAba={ROTULO_ABA[aba]} aoImprimir={aoImprimir} />
        </div>
      </div>
    </header>
  );
}

/**
 * Central de relatórios da equipe. Recebe o relatório já calculado (dados reais ou de
 * demonstração) e não conhece Supabase nem rotas: a aba ativa e a troca de aba vêm de fora.
 */
export function CentralRelatorios({
  relatorio,
  modo,
  aba,
  aoMudarAba,
  atualizadoEm,
  aoAtualizar,
  atualizando = false,
}: {
  relatorio: RelatorioGeral;
  modo: ModoRelatorio;
  aba: AbaRelatorio;
  aoMudarAba: (aba: AbaRelatorio) => void;
  /** Instante (ms) da última leitura dos dados, para "atualizado às HH:mm". */
  atualizadoEm?: number | undefined;
  /** Se informado, mostra o botão "Atualizar". */
  aoAtualizar?: (() => void) | undefined;
  atualizando?: boolean;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const abaAnterior = useRef(aba);
  const imprimindo = useImpressao();
  const [escopo, setEscopo] = useState<EscopoImpressao>("aba");
  const completo = imprimindo && escopo === "completo";

  // Terminada a impressão, volta ao padrão: Ctrl+P imprime só a seção aberta.
  useEffect(() => {
    if (!imprimindo) setEscopo("aba");
  }, [imprimindo]);

  function imprimir(novoEscopo: EscopoImpressao) {
    flushSync(() => setEscopo(novoEscopo));
    // Deixa o menu fechar antes de abrir o diálogo de impressão.
    window.setTimeout(() => window.print(), 0);
  }

  // Ao trocar de aba: a aba ativa fica visível na faixa rolável e, se o foco se perdeu (clique num
  // link da própria página), ele vai para o painel novo em vez de voltar ao topo do documento.
  useEffect(() => {
    raiz.current
      ?.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
    if (abaAnterior.current === aba) return;
    abaAnterior.current = aba;
    // Um quadro depois: o painel novo só deixa de estar oculto na renderização seguinte.
    const quadro = window.requestAnimationFrame(() => {
      const painelAtivo = raiz.current?.querySelector<HTMLElement>(
        '[role="tabpanel"][data-state="active"]',
      );
      const foco = document.activeElement;
      // Perdido: no corpo da página ou ainda dentro do painel da aba que saiu.
      const perdeu =
        !foco ||
        foco === document.body ||
        (foco.closest('[role="tabpanel"]') !== null && !painelAtivo?.contains(foco));
      if (perdeu) painelAtivo?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(quadro);
  }, [aba]);

  const semAlunos = relatorio.kpis.alunosTotal === 0;

  return (
    <div ref={raiz} data-relatorio-raiz className="space-y-6 sm:space-y-8">
      {modo === "demo" ? <BannerDemonstracao /> : null}
      <Cabecalho
        relatorio={relatorio}
        modo={modo}
        aba={aba}
        atualizadoEm={atualizadoEm}
        aoAtualizar={aoAtualizar}
        atualizando={atualizando}
        aoImprimir={imprimir}
      />

      {semAlunos ? (
        <EstadoVazio
          icone={<UsersRound />}
          titulo="Nenhum aluno cadastrado ainda"
          texto="Assim que houver alunos, pagamentos e treinos registrados, os relatórios aparecem aqui."
        />
      ) : (
        <Tabs
          value={aba}
          onValueChange={(valor) => {
            if (ehAba(valor)) aoMudarAba(valor);
          }}
          className={cn(completo && "print:hidden")}
        >
          <div className="print:hidden">
            <TabsList
              aria-label="Seções do relatório"
              className="sem-barra-rolagem h-auto w-full justify-start gap-1 overflow-x-auto rounded-full bg-white/[0.05] p-1 sm:w-fit sm:max-w-full"
            >
              {ABAS_RELATORIO.map((id) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="min-h-11 shrink-0 rounded-full px-4 text-sm text-muted-foreground hover:text-foreground data-[state=active]:bg-brand-yellow data-[state=active]:font-semibold data-[state=active]:text-brand-black data-[state=active]:shadow-none"
                >
                  {ROTULO_ABA[id]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {ABAS_RELATORIO.map((id) => (
            <TabsContent
              key={id}
              value={id}
              className="mt-5 rounded-3xl outline-none focus-visible:ring-offset-background sm:mt-6"
            >
              <TituloDaSecao aba={id} />
              <ConteudoDaAba aba={id} relatorio={relatorio} modo={modo} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {completo && !semAlunos ? (
        <div className="hidden print:block">
          {ABAS_RELATORIO.map((id, indice) => (
            <section key={id} className={cn(indice > 0 && "print:break-before-page")}>
              <TituloDaSecao aba={id} />
              <ConteudoDaAba aba={id} relatorio={relatorio} modo={modo} />
            </section>
          ))}
        </div>
      ) : null}

      <footer className="hidden border-t border-white/10 pt-3 text-xs text-muted-foreground print:block">
        Family Gym · Central de relatórios · Gerado em {formatarDataExtensa(relatorio.geradoEm)}
        {modo === "demo" ? ` · ${ROTULO_DEMO}` : ""}
      </footer>
    </div>
  );
}
