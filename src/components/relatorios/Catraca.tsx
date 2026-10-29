import { Activity, Clock, DoorOpen, KeyRound, Plug, TriangleAlert, Users } from "lucide-react";
import { AbaOperacao } from "@/components/relatorios/operacao/AbaOperacao";
import {
  BotaoExportarCsv,
  Entrada,
  GradeKpis,
  KpiRelatorio,
  SecaoRelatorio,
} from "@/components/relatorios/blocos";
import { BarrasHorizontais, GraficoBarrasRelatorio } from "@/components/relatorios/graficos";
import type { PropsAba } from "@/components/relatorios/tipos";
import {
  csvAcessosPorDia,
  csvAcessosPorHora,
  csvContagem,
} from "@/lib/relatorios/exportacoes-operacao";
import { nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { formatarNumero, formatarPercentual, pluralizar, TRACO } from "@/lib/relatorios/formatar";
import type { RelatorioApi, RelatorioCatraca } from "@/lib/relatorios/operacao";

function Conteudo({
  c,
  api,
  semApi,
  geradoEm,
  modo,
}: {
  c: RelatorioCatraca;
  api: RelatorioApi;
  semApi: boolean;
  geradoEm: string;
  modo: PropsAba["modo"];
}) {
  const horasComAcesso = c.porHora.filter((h) => h.hora >= 5 && h.hora <= 23);
  return (
    <div className="space-y-4 sm:space-y-6">
      <GradeKpis rotulo="Indicadores da catraca">
        <KpiRelatorio
          atraso={0}
          rotulo="Acessos em 30 dias"
          valor={formatarNumero(c.acessos)}
          icone={<DoorOpen />}
          detalhe={`${formatarNumero(c.mediaPorDia, 1)} por dia, em média`}
          dica="Entradas registradas pela catraca, recepção ou integração nos últimos 30 dias."
        />
        <KpiRelatorio
          atraso={50}
          rotulo="Alunos que passaram na catraca"
          valor={formatarNumero(c.alunosDistintos)}
          icone={<Users />}
          detalhe={`${formatarPercentual(c.presencaDeAtivosPct, 0)} dos alunos ativos`}
          dica="Alunos diferentes com ao menos um acesso nos últimos 30 dias, sobre os alunos ativos."
        />
        <KpiRelatorio
          atraso={100}
          rotulo="Horário de pico"
          valor={c.horaDePico === null ? TRACO : `${String(c.horaDePico).padStart(2, "0")}h`}
          icone={<Clock />}
          detalhe="hora com mais entradas (horário de Brasília)"
          dica="Hora cheia com o maior número de acessos nos últimos 30 dias."
        />
        <KpiRelatorio
          atraso={150}
          rotulo="Ativos sem passar na catraca"
          valor={formatarNumero(c.ativosSemAcesso)}
          icone={<Activity />}
          tom="neutro"
          detalhe="bom grupo para uma mensagem de incentivo"
          dica="Alunos ativos menos os que passaram na catraca nos últimos 30 dias. É uma estimativa: acessos de quem não está mais ativo não entram na conta."
        />
      </GradeKpis>

      <Entrada atraso={120} className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <SecaoRelatorio
          titulo="Acessos por hora"
          descricao="Em que horários a academia fica mais cheia (últimos 30 dias)."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("acessos-por-hora", geradoEm, modo)}
              gerar={() => csvAcessosPorHora(c.porHora)}
              assunto="acessos por hora"
              desabilitado={c.acessos === 0}
            />
          }
        >
          <GraficoBarrasRelatorio
            dados={horasComAcesso.map((h) => ({
              rotulo: String(h.hora),
              nome: h.rotulo,
              valor: h.valor,
            }))}
            resumo={
              c.horaDePico === null
                ? "Sem acessos registrados nos últimos 30 dias."
                : `Pico às ${String(c.horaDePico).padStart(2, "0")}h.`
            }
            legenda="Acessos por hora do dia"
            colunaValor="Acessos"
            colunaRotulo="Hora"
            altura={200}
          />
        </SecaoRelatorio>
        <SecaoRelatorio
          titulo="Acessos por dia da semana"
          descricao="Quais dias têm mais movimento."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("acessos-por-dia-da-semana", geradoEm, modo)}
              gerar={() => csvAcessosPorDia(c.porDiaSemana)}
              assunto="acessos por dia da semana"
              desabilitado={c.acessos === 0}
            />
          }
        >
          <GraficoBarrasRelatorio
            dados={c.porDiaSemana.map((d) => ({
              rotulo: d.nome.slice(0, 3),
              nome: d.nome,
              valor: d.valor,
            }))}
            resumo="Acessos por dia da semana nos últimos 30 dias."
            legenda="Acessos por dia da semana"
            colunaValor="Acessos"
            altura={200}
          />
        </SecaoRelatorio>
      </Entrada>

      <Entrada atraso={160}>
        <SecaoRelatorio
          titulo="Integração (API)"
          descricao="Uso da API pelos sistemas conectados (catraca, Tecnofit e outros) nos últimos 7 dias."
        >
          {semApi ? (
            <p className="text-sm text-muted-foreground">
              A API ainda não foi ativada neste banco. Aplique a atualização do banco para usá-la.
            </p>
          ) : (
            <div className="space-y-5">
              <GradeKpis rotulo="Indicadores da API">
                <KpiRelatorio
                  rotulo="Chamadas"
                  valor={formatarNumero(api.chamadas)}
                  icone={<Plug />}
                  detalhe="nos últimos 7 dias"
                  dica="Chamadas registradas: todas as que gravam dados ou falham. Leituras bem-sucedidas não são registradas."
                />
                <KpiRelatorio
                  rotulo="Taxa de erro"
                  valor={api.chamadas ? formatarPercentual(api.taxaErroPct, 1) : TRACO}
                  icone={<TriangleAlert />}
                  tom={api.taxaErroPct > 10 ? "alerta" : api.taxaErroPct > 3 ? "atencao" : "neutro"}
                  detalhe={`${pluralizar(api.erros, "erro")} (4xx e 5xx)`}
                  dica="Chamadas com resposta 400 ou maior sobre todas as chamadas registradas."
                />
                <KpiRelatorio
                  rotulo="Chaves ativas"
                  valor={formatarNumero(api.chavesAtivas)}
                  icone={<KeyRound />}
                  detalhe={`${formatarNumero(api.chavesRevogadas)} revogadas`}
                  dica="Chaves de API em uso. Revogue as que não são mais necessárias."
                />
                <KpiRelatorio
                  rotulo="Chaves paradas"
                  valor={formatarNumero(api.chavesSemUso)}
                  icone={<KeyRound />}
                  tom={api.chavesSemUso > 0 ? "atencao" : "neutro"}
                  detalhe="sem uso há mais de 30 dias"
                  dica="Chaves ativas nunca usadas ou sem uso nos últimos 30 dias: boas candidatas a revogar."
                />
              </GradeKpis>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Rotas mais chamadas</h3>
                    <BotaoExportarCsv
                      arquivo={nomeExportacao("api-por-rota", geradoEm, modo)}
                      gerar={() => csvContagem("Rota", api.porRota)}
                      assunto="chamadas da API por rota"
                      desabilitado={api.porRota.length === 0}
                    />
                  </div>
                  {api.porRota.length ? (
                    <BarrasHorizontais
                      itens={api.porRota.map((r) => ({
                        id: r.chave,
                        nome: r.nome,
                        valor: r.valor,
                        rotuloValor: formatarNumero(r.valor),
                      }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma chamada registrada.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Respostas</h3>
                  <BarrasHorizontais
                    itens={api.porClasse.map((k) => ({
                      id: k.classe,
                      nome:
                        k.classe === "2xx"
                          ? "2xx: deu certo"
                          : k.classe === "4xx"
                            ? "4xx: erro de quem chamou"
                            : k.classe === "5xx"
                              ? "5xx: erro do sistema"
                              : "3xx: redirecionamento",
                      valor: k.valor,
                      rotuloValor: formatarNumero(k.valor),
                      tom: k.classe === "5xx" || k.classe === "4xx" ? "alerta" : "normal",
                    }))}
                  />
                </div>
              </div>
            </div>
          )}
        </SecaoRelatorio>
      </Entrada>
    </div>
  );
}

/** Aba Catraca e API: movimento por hora e dia, presença dos ativos e saúde das integrações. */
export function Catraca({ relatorio, modo }: PropsAba) {
  return (
    <AbaOperacao
      relatorio={relatorio}
      modo={modo}
      modulo="acessos"
      nomeDoModulo="Catraca e integração"
    >
      {(op) => (
        <Conteudo
          c={op.catraca}
          api={op.api}
          semApi={!op.modulos.api}
          geradoEm={relatorio.geradoEm}
          modo={modo}
        />
      )}
    </AbaOperacao>
  );
}
