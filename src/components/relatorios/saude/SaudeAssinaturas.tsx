import { FileSignature } from "lucide-react";
import { EstadoVazio } from "@/components/app/ui";
import { SecaoRelatorio } from "@/components/relatorios/blocos";
import type { PropsAba } from "@/components/relatorios/tipos";
import { JANELA_RECENTE_DIAS } from "@/lib/relatorios/agregar";
import { formatarNumero } from "@/lib/relatorios/formatar";
import { resumirAssinaturas } from "@/lib/relatorios/saude";

function LinhaAssinatura({
  rotulo,
  detalhe,
  valor,
}: {
  rotulo: string;
  detalhe: string;
  valor: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <dt className="text-sm font-medium">{rotulo}</dt>
        <dd className="mt-0.5 text-xs leading-snug text-muted-foreground">{detalhe}</dd>
      </div>
      <p className="shrink-0 font-display text-2xl font-bold tabular-nums">{valor}</p>
    </div>
  );
}

export function SaudeAssinaturas({
  relatorio,
  className,
}: Pick<PropsAba, "relatorio"> & { className?: string | undefined }) {
  const a = resumirAssinaturas(relatorio.assinaturas);

  return (
    <SecaoRelatorio
      titulo="Assinaturas de relatório"
      className={className}
      descricao="Assinaturas registradas nos relatórios individuais de evolução dos alunos."
    >
      {a.total > 0 ? (
        <dl>
          <LinhaAssinatura
            rotulo="Assinaturas registradas"
            detalhe="no total, desde o início"
            valor={formatarNumero(a.total)}
          />
          <LinhaAssinatura
            rotulo="Alunos com assinatura"
            detalhe={
              a.mediaPorAluno === null
                ? "alunos diferentes"
                : `${formatarNumero(a.mediaPorAluno, 1)} assinaturas por aluno, em média`
            }
            valor={formatarNumero(a.alunos)}
          />
          <LinhaAssinatura
            rotulo={`Últimos ${JANELA_RECENTE_DIAS} dias`}
            detalhe={a.ultimos30d === 0 ? "nenhuma assinatura recente" : "assinaturas recentes"}
            valor={formatarNumero(a.ultimos30d)}
          />
        </dl>
      ) : (
        <EstadoVazio
          icone={<FileSignature />}
          titulo="Nenhuma assinatura ainda"
          texto="Quando os relatórios individuais dos alunos forem assinados, o resumo aparece aqui."
          className="py-8"
        />
      )}
    </SecaoRelatorio>
  );
}
