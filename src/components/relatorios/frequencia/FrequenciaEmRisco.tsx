import { CircleCheck, Info } from "lucide-react";
import { EstadoVazio, Selo } from "@/components/app/ui";
import {
  BotaoExportarCsv,
  SecaoRelatorio,
  TabelaRelatorio,
  type ColunaTabela,
} from "@/components/relatorios/blocos";
import { Dado, GradeDados } from "@/components/relatorios/DadosResumo";
import { FrequenciaContato } from "@/components/relatorios/frequencia/FrequenciaContato";
import type { PropsAba } from "@/components/relatorios/tipos";
import { DIAS_SEM_TREINO_RISCO, MAX_ALUNOS_RISCO } from "@/lib/relatorios/agregar";
import { csvAlunosEmRisco } from "@/lib/relatorios/exportacoes-frequencia-saude";
import { nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { resumirRisco, tomRisco } from "@/lib/relatorios/frequencia";
import {
  TRACO,
  formatarData,
  formatarDias,
  formatarDiasSemTreinar,
  formatarNumero,
  pluralizar,
} from "@/lib/relatorios/formatar";
import type { AlunoRisco } from "@/lib/relatorios/types";

const COLUNAS: readonly ColunaTabela<AlunoRisco>[] = [
  { id: "nome", titulo: "Aluno", papel: "titulo", celula: (a) => a.nome, classe: "font-medium" },
  { id: "plano", titulo: "Plano", papel: "subtitulo", celula: (a) => a.plano },
  { id: "turno", titulo: "Turno", celula: (a) => a.turno || TRACO },
  {
    id: "sem-treinar",
    titulo: "Sem treinar",
    papel: "selo",
    celula: (a) => (
      <Selo tom={tomRisco(a.diasSemTreinar)}>{formatarDiasSemTreinar(a.diasSemTreinar)}</Selo>
    ),
    classe: "whitespace-nowrap",
  },
  {
    id: "ultimo-treino",
    titulo: "Último treino",
    celula: (a) => formatarData(a.ultimoTreino),
    classe: "whitespace-nowrap",
  },
  {
    id: "contato",
    titulo: "Contato",
    larga: true,
    celula: (a) => <FrequenciaContato nome={a.nome} telefone={a.telefone} />,
    classe: "whitespace-nowrap",
  },
];

/** Explica quem entra na lista, para ninguém ler o número sem saber o que ele conta. */
function CriterioRisco() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/5 p-4 text-sm leading-relaxed">
      <Info className="mt-0.5 size-5 shrink-0 text-brand-yellow" aria-hidden />
      <p className="text-foreground/90">
        <strong className="font-semibold text-foreground">Quem entra na lista:</strong> aluno ativo
        com {formatarDias(DIAS_SEM_TREINO_RISCO)} ou mais sem treinar. Quem nunca treinou só entra
        depois de {formatarDias(DIAS_SEM_TREINO_RISCO)} de cadastro, para não alertar sobre quem
        acabou de chegar. A lista traz os {MAX_ALUNOS_RISCO} casos mais graves, do maior sumiço para
        o menor.
      </p>
    </div>
  );
}

export function FrequenciaEmRisco({ relatorio, modo }: PropsAba) {
  const lista = relatorio.emRisco;
  const resumo = resumirRisco(lista, relatorio.kpis.alunosEmRisco);
  const entreListados = resumo.truncada
    ? `entre os ${formatarNumero(resumo.listados)} listados`
    : null;

  return (
    <SecaoRelatorio
      titulo="Alunos em risco de abandono"
      evitarQuebra={false}
      descricao="Quem parou de aparecer: a hora de ligar antes que o aluno vá embora."
      acoes={
        <BotaoExportarCsv
          arquivo={nomeExportacao("alunos-em-risco", relatorio.geradoEm, modo)}
          gerar={() => csvAlunosEmRisco(lista)}
          assunto="alunos em risco de abandono"
          desabilitado={lista.length === 0}
        />
      }
    >
      <div className="space-y-5">
        <CriterioRisco />
        {lista.length > 0 ? (
          <>
            <GradeDados colunas={4}>
              <Dado
                rotulo="Alunos em risco"
                valor={formatarNumero(resumo.total)}
                detalhe="no total, entre os ativos"
              />
              <Dado
                rotulo="Nunca treinaram"
                valor={formatarNumero(resumo.nuncaTreinaram)}
                detalhe={entreListados ?? "cadastrados e sem nenhum treino"}
              />
              <Dado
                rotulo="Parados há 30+ dias"
                valor={formatarNumero(resumo.paradosHa30Dias)}
                detalhe={entreListados ?? "já treinaram, mas sumiram"}
              />
              <Dado
                rotulo="Com telefone"
                valor={formatarNumero(resumo.comTelefone)}
                detalhe={`para ligar, de ${formatarNumero(resumo.listados)} listados`}
              />
            </GradeDados>
            <TabelaRelatorio
              rotulo="Alunos em risco de abandono"
              colunas={COLUNAS}
              linhas={lista}
              chaveLinha={(a) => a.alunoId}
              itens={["aluno", "alunos"]}
            />
            {resumo.truncada ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Mostrando os {formatarNumero(resumo.listados)} casos mais graves de{" "}
                {pluralizar(resumo.total, "aluno em risco", "alunos em risco")}. Os demais ficam
                fora da lista e da exportação.
              </p>
            ) : null}
          </>
        ) : (
          <EstadoVazio
            icone={<CircleCheck />}
            titulo="Nenhum aluno em risco"
            texto={`Nenhum aluno ativo está há ${formatarDias(DIAS_SEM_TREINO_RISCO)} ou mais sem treinar.`}
            className="py-10"
          />
        )}
      </div>
    </SecaoRelatorio>
  );
}
