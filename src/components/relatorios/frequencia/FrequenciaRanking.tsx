import { Trophy } from "lucide-react";
import { EstadoVazio } from "@/components/app/ui";
import { BotaoExportarCsv, SecaoRelatorio } from "@/components/relatorios/blocos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { TAMANHO_RANKING } from "@/lib/relatorios/agregar";
import { csvRanking } from "@/lib/relatorios/exportacoes-frequencia-saude";
import { nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import {
  formatarMesAno,
  formatarMinutos,
  percentualDe,
  pluralizar,
} from "@/lib/relatorios/formatar";
import type { AlunoRanking } from "@/lib/relatorios/types";
import { cn } from "@/lib/utils";

const PODIO = 3;

function LinhaRanking({
  aluno,
  posicao,
  maiorNumeroDeTreinos,
}: {
  aluno: AlunoRanking;
  posicao: number;
  maiorNumeroDeTreinos: number;
}) {
  const noPodio = posicao <= PODIO;
  return (
    <li className="flex items-start gap-3 border-b border-foreground/10 py-3 first:pt-0 last:border-b-0 last:pb-0 print:break-inside-avoid">
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full font-display text-sm font-bold tabular-nums",
          noPodio
            ? "bg-brand-yellow text-brand-black"
            : "border border-foreground/15 text-muted-foreground",
        )}
      >
        <span className="sr-only">Posição </span>
        {posicao}
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words font-medium leading-snug">{aluno.nome}</p>
        <p className="break-words text-xs leading-snug text-muted-foreground">{aluno.plano}</p>
        <div
          aria-hidden
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
        >
          <div
            className="h-full rounded-full bg-brand-yellow"
            style={{ width: `${Math.max(percentualDe(aluno.treinos, maiorNumeroDeTreinos), 2)}%` }}
          />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold tabular-nums">{pluralizar(aluno.treinos, "treino")}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatarMinutos(aluno.minutos)}
        </p>
      </div>
    </li>
  );
}

export function FrequenciaRanking({ relatorio, modo }: PropsAba) {
  const { ranking } = relatorio;
  const maiorNumeroDeTreinos = ranking.reduce((m, r) => Math.max(m, r.treinos), 0);

  return (
    <SecaoRelatorio
      titulo="Mais assíduos do mês"
      descricao={`Até ${TAMANHO_RANKING} alunos com mais dias de treino em ${formatarMesAno(relatorio.hoje)}, contando até hoje. No empate, vale o maior tempo treinado.`}
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("mais-assiduos", relatorio.geradoEm, modo)}
          gerar={() => csvRanking(ranking)}
          assunto="alunos mais assíduos do mês"
          desabilitado={ranking.length === 0}
        />
      }
    >
      {ranking.length > 0 ? (
        <ol aria-label="Alunos mais assíduos do mês">
          {ranking.map((aluno, indice) => (
            <LinhaRanking
              key={aluno.alunoId}
              aluno={aluno}
              posicao={indice + 1}
              maiorNumeroDeTreinos={maiorNumeroDeTreinos}
            />
          ))}
        </ol>
      ) : (
        <EstadoVazio
          icone={<Trophy />}
          titulo="Ninguém treinou ainda neste mês"
          texto="Quando houver treinos registrados, os alunos mais assíduos aparecem aqui."
          className="py-8"
        />
      )}
    </SecaoRelatorio>
  );
}
