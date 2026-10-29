import { Link } from "@tanstack/react-router";
import { FileLock2, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { AbaOperacao } from "@/components/relatorios/operacao/AbaOperacao";
import {
  BotaoExportarCsv,
  Entrada,
  GradeKpis,
  KpiRelatorio,
  SecaoRelatorio,
} from "@/components/relatorios/blocos";
import { BarrasHorizontais } from "@/components/relatorios/graficos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { Button } from "@/components/ui/button";
import {
  csvSeguranca,
  rotuloDaAcaoLgpd,
  rotuloDoPapel,
} from "@/lib/relatorios/exportacoes-operacao";
import { nomeExportacao } from "@/lib/relatorios/exportacoes-visao-financeiro";
import { formatarData, formatarNumero, pluralizar, TRACO } from "@/lib/relatorios/formatar";
import type { RelatorioSeguranca } from "@/lib/relatorios/operacao";

function Conteudo({
  s,
  geradoEm,
  modo,
}: {
  s: RelatorioSeguranca;
  geradoEm: string;
  modo: PropsAba["modo"];
}) {
  const gestao = s.porPapel.find((p) => p.papel === "staff")?.valor ?? 0;
  return (
    <div className="space-y-4 sm:space-y-6">
      <GradeKpis rotulo="Indicadores de equipe e dados pessoais">
        <KpiRelatorio
          atraso={0}
          rotulo="Pessoas na equipe"
          valor={formatarNumero(s.equipeTotal)}
          icone={<UsersRound />}
          detalhe="com acesso ao painel"
          dica="Contas com perfil de gestão, recepção ou professor."
        />
        <KpiRelatorio
          atraso={50}
          rotulo="Contas de gestão"
          valor={formatarNumero(gestao)}
          icone={<UserCog />}
          tom={gestao === 0 ? "alerta" : gestao > 3 ? "atencao" : "neutro"}
          detalhe={
            gestao > 3
              ? "muitas: dê gestão só a quem precisa"
              : "gestão vê tudo, inclusive dados de saúde"
          }
          dica="A gestão tem acesso total (relatórios, financeiro, integrações, dados pessoais). Mantenha poucas contas e ative a verificação em duas etapas."
        />
        <KpiRelatorio
          atraso={100}
          rotulo="Pedidos de dados (12 meses)"
          valor={formatarNumero(s.lgpdTotal)}
          icone={<FileLock2 />}
          detalhe="exportações, anonimizações e exclusões"
          dica="Ações feitas na tela Dados pessoais (LGPD) nos últimos 12 meses. O registro guarda só o tipo, a data e quem executou, nunca dados do aluno."
        />
        <KpiRelatorio
          atraso={150}
          rotulo="Última ação de LGPD"
          valor={s.ultimaAcaoLgpd ? formatarData(s.ultimaAcaoLgpd) : TRACO}
          icone={<ShieldCheck />}
          detalhe={s.ultimaAcaoLgpd ? "data do último pedido atendido" : "nenhum pedido atendido"}
          dica="Data da ação mais recente registrada na tela Dados pessoais (LGPD)."
        />
      </GradeKpis>

      <Entrada atraso={120} className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <SecaoRelatorio
          titulo="Equipe por perfil"
          descricao="Quantas pessoas têm cada tipo de acesso."
          acoes={
            <BotaoExportarCsv
              arquivo={nomeExportacao("equipe-e-lgpd", geradoEm, modo)}
              gerar={() => csvSeguranca(s)}
              assunto="equipe e LGPD"
            />
          }
        >
          {s.porPapel.length ? (
            <BarrasHorizontais
              itens={s.porPapel.map((p) => ({
                id: p.papel,
                nome: rotuloDoPapel(p.papel),
                valor: p.valor,
                rotuloValor: pluralizar(p.valor, "pessoa"),
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum perfil de equipe cadastrado.</p>
          )}
        </SecaoRelatorio>
        <SecaoRelatorio
          titulo="Pedidos de dados pessoais"
          descricao="O que foi feito em atendimento à LGPD nos últimos 12 meses."
        >
          {s.lgpdPorAcao.length ? (
            <BarrasHorizontais
              itens={s.lgpdPorAcao.map((a) => ({
                id: a.acao,
                nome: rotuloDaAcaoLgpd(a.acao),
                valor: a.valor,
                rotuloValor: formatarNumero(a.valor),
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum pedido atendido neste período.</p>
          )}
          <Button asChild variant="outline" className="mt-4 min-h-11 rounded-full print:hidden">
            <Link to="/dados-pessoais">Abrir Dados pessoais (LGPD)</Link>
          </Button>
        </SecaoRelatorio>
      </Entrada>
    </div>
  );
}

/** Aba Equipe e LGPD: quem tem acesso ao painel e como estão os pedidos de dados pessoais. */
export function Seguranca({ relatorio, modo }: PropsAba) {
  return (
    <AbaOperacao relatorio={relatorio} modo={modo} modulo="lgpd" nomeDoModulo="Equipe e LGPD">
      {(op) => <Conteudo s={op.seguranca} geradoEm={relatorio.geradoEm} modo={modo} />}
    </AbaOperacao>
  );
}
