import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hojeBrasilia } from "@/lib/datas";
import { traduzErroServidor } from "@/lib/erros-servidor";
import { CHAVE_PIX_DA_ACADEMIA } from "@/lib/pix";
import { formatarBRL } from "@/lib/planos-precos";
import { dataPorExtenso, formatarCnpj, fraseDoRecibo, type Recibo } from "@/lib/recibo";
import { obterRecibo } from "@/lib/recibo.functions";
import { contatoDaAcademia, formatarTelefoneBR } from "@/lib/site";
import { ehUuid } from "@/lib/uuid";

export const Route = createFileRoute("/_authenticated/recibo/$pagamentoId")({
  head: () => ({
    meta: [{ title: "Recibo | Academia Family Gym" }, { name: "robots", content: "noindex" }],
  }),
  component: PaginaRecibo,
});

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-widest opacity-70">{rotulo}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  );
}

/** O papel: Alabastro com texto Ônix na tela e papel branco na impressão (sem gastar tinta de fundo). */
function Papel({ recibo }: { recibo: Recibo }) {
  const dataDeHoje = dataPorExtenso(hojeBrasilia());
  const { endereco, whatsapp } = contatoDaAcademia;
  return (
    <article
      aria-labelledby="titulo-recibo"
      className="mx-auto max-w-2xl rounded-2xl bg-fg-alabastro p-6 text-fg-onix shadow-lg sm:p-10 print:max-w-none print:rounded-none print:bg-transparent print:p-0 print:shadow-none"
    >
      <header className="flex items-start justify-between gap-4 border-b-4 border-fg-amarelo pb-4 print:border-fg-onix">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em]">
            Academia Family Gym
          </p>
          <h1 id="titulo-recibo" className="font-display text-4xl leading-none sm:text-5xl">
            Recibo
          </h1>
        </div>
        <p className="text-right">
          <span className="block text-xs font-bold uppercase tracking-widest opacity-70">Nº</span>
          <span className="whitespace-nowrap font-bold tabular-nums">{recibo.numero}</span>
        </p>
      </header>

      <p className="mt-6 font-display text-4xl tabular-nums sm:text-5xl">
        {formatarBRL(recibo.valor)}
      </p>
      <p className="mt-4 text-base leading-relaxed sm:text-lg">{fraseDoRecibo(recibo)}</p>

      <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        <Campo rotulo="Aluno" valor={recibo.alunoNome} />
        {recibo.plano ? <Campo rotulo="Plano" valor={recibo.plano} /> : null}
        <Campo rotulo="Referente a" valor={recibo.referenciaTexto} />
        {recibo.parcelaTexto ? <Campo rotulo="Parcela" valor={recibo.parcelaTexto} /> : null}
        <Campo rotulo="Pago em" valor={recibo.pagoEmPorExtenso} />
        <Campo rotulo="Forma de pagamento" valor={recibo.metodo} />
      </dl>

      <footer className="mt-10 space-y-1 border-t border-fg-onix/30 pt-4 text-xs leading-relaxed">
        <p>
          <strong>Academia Family Gym</strong> · CNPJ {formatarCnpj(CHAVE_PIX_DA_ACADEMIA)}
        </p>
        {endereco ? <p>{endereco}</p> : null}
        {whatsapp ? <p>WhatsApp {formatarTelefoneBR(whatsapp)}</p> : null}
        <p className="pt-2 opacity-80">
          Recibo de pagamento, sem valor fiscal. Emitido em {dataDeHoje}.
        </p>
      </footer>
    </article>
  );
}

function PaginaRecibo() {
  const { pagamentoId } = Route.useParams();
  const router = useRouter();
  const buscar = useServerFn(obterRecibo);
  const idValido = ehUuid(pagamentoId);
  const {
    data: recibo,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["recibo", pagamentoId],
    queryFn: () => buscar({ data: { id: pagamentoId } }),
    enabled: idValido,
    // "Recibo não encontrado" não melhora se repetir; quem quer tentar de novo clica no botão.
    retry: false,
  });

  function voltar() {
    // Aberto direto (por um favorito, por exemplo) não há para onde voltar: leva ao app.
    if (window.history.length > 1) router.history.back();
    else void router.navigate({ to: "/app" });
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 print:min-h-0 print:bg-transparent print:p-0">
      <div className="mx-auto mb-4 flex max-w-2xl items-center justify-between gap-3 print:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={voltar}
          className="min-h-11 gap-2 rounded-full"
        >
          <ArrowLeft className="size-4" aria-hidden /> Voltar
        </Button>
        {recibo ? (
          <Button
            type="button"
            onClick={() => window.print()}
            className="min-h-11 gap-2 rounded-full"
          >
            <Printer className="size-4" aria-hidden /> Imprimir / salvar PDF
          </Button>
        ) : null}
      </div>

      {!idValido ? (
        <p
          role="alert"
          className="mx-auto max-w-2xl rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          Recibo inválido.
        </p>
      ) : isLoading ? (
        <p
          role="status"
          className="mx-auto flex max-w-2xl items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando recibo...
        </p>
      ) : error ? (
        <div className="mx-auto max-w-2xl space-y-3">
          <p
            role="alert"
            className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {traduzErroServidor(error)}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
            className="min-h-11 rounded-full"
          >
            Tentar de novo
          </Button>
        </div>
      ) : recibo ? (
        <Papel recibo={recibo} />
      ) : null}
    </main>
  );
}
