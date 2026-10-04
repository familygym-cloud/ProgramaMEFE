import { FileSignature } from "lucide-react";
import { SecaoAluno } from "@/components/relatorios/aluno/blocosAluno";
import {
  AVISO_IMC,
  linhasDeAssinaturas,
  quemAssinaPeloAluno,
  textoOuTraco,
} from "@/lib/relatorios/aluno-documento";
import { ROTULO_DEMO } from "@/lib/relatorios/fixtures";
import { formatarDataExtensa } from "@/lib/relatorios/formatar";
import type { ModoRelatorio } from "@/lib/relatorios/abas";
import type { RelatorioAluno } from "@/lib/relatorios/types";
import { cn } from "@/lib/utils";

/** Histórico de assinaturas já registradas neste tipo de relatório, da mais recente à mais antiga. */
export function AlunoHistoricoAssinaturas({ relatorio }: { relatorio: RelatorioAluno }) {
  const linhas = linhasDeAssinaturas(relatorio.assinaturas);

  return (
    <SecaoAluno
      titulo="Histórico de assinaturas"
      descricao="Assinaturas registradas nos relatórios deste aluno, da mais recente para a mais antiga."
      atraso={240}
    >
      {linhas.length > 0 ? (
        <ul aria-label="Assinaturas registradas" className="divide-y divide-white/10">
          {linhas.map((linha, indice) => (
            <li
              key={`${linha.data}-${linha.referencia}-${indice}`}
              className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0 print:break-inside-avoid print:py-1.5"
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-medium leading-snug">{linha.assinante}</p>
                <p className="mt-0.5 break-words text-xs leading-snug text-muted-foreground">
                  {linha.referencia}
                </p>
              </div>
              <p className="shrink-0 text-sm tabular-nums text-muted-foreground">{linha.data}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <FileSignature className="mt-0.5 size-5 shrink-0 text-brand-yellow" aria-hidden />
          Nenhuma assinatura registrada para este aluno até agora.
        </p>
      )}
    </SecaoAluno>
  );
}

function LinhaParaAssinar({
  titulo,
  legenda,
  dica,
}: {
  titulo: string;
  legenda: string;
  dica: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[0.68rem] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
        {titulo}
      </p>
      {/* Espaço em branco para a assinatura à mão, acima da linha. */}
      <div className="h-16 sm:h-20 print:h-20" aria-hidden />
      <div className="border-t-2 border-foreground/60 pt-2">
        <p className="break-words text-sm font-medium leading-snug">{legenda}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{dica}</p>
      </div>
      <p className="mt-4 text-sm tabular-nums text-muted-foreground print:mt-3">
        Data: ____ / ____ / ________
      </p>
    </div>
  );
}

/** Bloco para assinar a mão depois de imprimir: aluno (ou responsável legal) e professor. */
export function AlunoBlocoAssinatura({ relatorio }: { relatorio: RelatorioAluno }) {
  const { aluno } = relatorio;
  const quem = quemAssinaPeloAluno(aluno);

  return (
    <SecaoAluno
      titulo="Assinaturas"
      cartaoNoPapel
      descricao="Imprima este relatório, confira as informações e assine abaixo."
      atraso={300}
    >
      <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2 print:grid-cols-2 print:gap-x-10">
        <LinhaParaAssinar
          titulo={quem.rotulo}
          legenda={quem.legenda}
          dica={quem.rotulo === "Aluno" ? "Nome e assinatura" : "Nome, documento e assinatura"}
        />
        <LinhaParaAssinar
          titulo="Professor(a) responsável"
          legenda="Nome do professor(a)"
          dica="Assinatura e CREF"
        />
      </div>
    </SecaoAluno>
  );
}

/** Rodapé do documento: marca, data de geração e o aviso responsável sobre o IMC. */
export function AlunoRodape({
  relatorio,
  modo,
  className,
}: {
  relatorio: RelatorioAluno;
  modo: ModoRelatorio;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        "space-y-1.5 border-t border-white/10 pt-4 text-xs leading-relaxed text-muted-foreground print:pt-2",
        className,
      )}
    >
      <p>
        <strong className="font-semibold text-foreground">Family Gym</strong> · Relatório individual
        de {textoOuTraco(relatorio.aluno.nome)} · Gerado em{" "}
        {formatarDataExtensa(relatorio.geradoEm)}
      </p>
      <p>{AVISO_IMC}</p>
      {modo === "demo" ? <p>{ROTULO_DEMO}</p> : null}
    </footer>
  );
}
