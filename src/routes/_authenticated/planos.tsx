import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Info, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/BrandLogo";
import {
  categoriasPlanos,
  descreverOpcao,
  formatarBRL,
  planosCatalogo,
} from "@/lib/planos-catalogo";

export const Route = createFileRoute("/_authenticated/planos")({
  head: () => ({
    meta: [
      { title: "Planos e valores | Academia Family Gym" },
      {
        name: "description",
        content:
          "Tabela oficial de planos da Academia Family Gym: musculação, terrestre, lutas, aquático, melhor idade e kids, com valores, parcelas e taxa de matrícula.",
      },
      { property: "og:title", content: "Planos e valores | Academia Family Gym" },
      {
        property: "og:description",
        content: "Valores, parcelas e taxa de matrícula de todos os planos da Academia Family Gym.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Planos,
});

function Planos() {
  const [filtro, setFiltro] = useState<string>("Todos");

  const lista = useMemo(
    () => (filtro === "Todos" ? planosCatalogo : planosCatalogo.filter((p) => p.categoria === filtro)),
    [filtro],
  );

  return (
    <div className="min-h-screen bg-background px-5 py-8 md:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-11" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                Planos e valores
              </span>
            </div>
            <h1 className="text-2xl font-semibold md:text-3xl">Tabela oficial de planos</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Valores por modalidade, opções de parcelamento e taxa de matrícula — para consultar na
              hora de fechar a matrícula do aluno.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 rounded-full text-xs uppercase tracking-widest"
          >
            <Link to="/dashboard">
              <ArrowLeft className="size-3.5" /> Painel
            </Link>
          </Button>
        </header>

        <div className="flex flex-wrap gap-2">
          {(["Todos", ...categoriasPlanos] as string[]).map((c) => (
            <Button
              key={c}
              size="sm"
              variant={filtro === c ? "default" : "outline"}
              className="rounded-full text-xs"
              onClick={() => setFiltro(c)}
            >
              {c}
            </Button>
          ))}
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          {lista.map((plano) => (
            <Card key={plano.slug} className="gap-4 p-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Tags className="size-4 text-primary" />
                  <Badge variant="secondary" className="text-[0.65rem] uppercase tracking-widest">
                    {plano.categoria}
                  </Badge>
                </div>
                <h2 className="text-base font-semibold">{plano.nome}</h2>
                <p className="text-sm text-muted-foreground">{plano.resumo}</p>
              </div>

              <ul className="space-y-1.5">
                {plano.opcoes.map((o) => (
                  <li
                    key={o.label}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{o.label}</span>
                    <span className="font-semibold tabular-nums">{descreverOpcao(o)}</span>
                  </li>
                ))}
                {plano.familia ? (
                  <li className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
                    <span>{plano.familia.label}</span>
                    <span className="font-semibold tabular-nums">
                      {plano.familia.parcelas}x de {formatarBRL(plano.familia.valor)} por pessoa
                    </span>
                  </li>
                ) : null}
              </ul>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="size-3.5 text-primary" />
                  Taxa de matrícula: {formatarBRL(plano.matricula)}
                </span>
                {plano.idadeMinima ? <span>· Idade mínima: {plano.idadeMinima} anos</span> : null}
              </div>

              {plano.inclui ? (
                <div className="space-y-1 text-xs">
                  <div className="font-medium">Inclui</div>
                  <p className="text-muted-foreground">{plano.inclui.join(" · ")}</p>
                </div>
              ) : null}

              {plano.modalidades ? (
                <div className="space-y-1 text-xs">
                  <div className="font-medium">Modalidades</div>
                  <p className="text-muted-foreground">{plano.modalidades.join(", ")}</p>
                </div>
              ) : null}

              {plano.observacoes ? (
                <div className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <div className="space-y-1">
                    {plano.observacoes.map((obs) => (
                      <p key={obs}>{obs}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
