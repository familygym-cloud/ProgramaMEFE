import { Link } from "@tanstack/react-router";
import {
  Activity,
  Apple,
  ArrowRight,
  Brain,
  FileText,
  LockKeyhole,
  Printer,
  Save,
} from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { todosOsFormularios } from "@/lib/formularios/catalogo";
import type { IdFormulario } from "@/lib/formularios/tipos";

const ICONES: Record<IdFormulario, ComponentType<{ className?: string }>> = {
  mefe: Activity,
  nutricional: Apple,
  psicologica: Brain,
};

const PASSOS = [
  { Icone: FileText, texto: "Preencha na tela, com os mesmos campos e a mesma ordem dos PDFs." },
  { Icone: Save, texto: "Salve o arquivo (.json) para continuar depois e abra-o quando quiser." },
  {
    Icone: Printer,
    texto: "Imprima em A4 ou salve como PDF, no mesmo desenho dos formulários originais.",
  },
] as const;

/** Lista dos três formulários digitais do Programa MEFE (área da equipe). */
export function HubFormularios() {
  return (
    <main id="conteudo" className="mx-auto max-w-[52rem] space-y-8 px-4 pb-24 pt-8 sm:pt-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-yellow">
          Programa MEFE · Equipe
        </p>
        <h1 className="text-3xl leading-tight text-foreground sm:text-4xl">
          Formulários do Programa MEFE
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Os três formulários do programa, preenchíveis na tela. Os cálculos (idade, IMC, médias,
          razões, macronutrientes, escores e notas) são automáticos, mostram a fórmula e podem ser
          editados: eles apoiam o julgamento do profissional, não o substituem.
        </p>
      </header>

      <section
        aria-labelledby="privacidade-formularios"
        className="rounded-2xl border border-brand-yellow/40 bg-card p-5"
      >
        <h2
          id="privacidade-formularios"
          className="flex items-center gap-2 text-lg text-foreground"
        >
          <LockKeyhole className="size-5 text-brand-yellow" aria-hidden /> Nada sai desta tela
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          O que você digita não é enviado ao servidor, não é gravado no navegador e não vai para
          nenhum banco de dados. Os dados existem só na aba aberta: ao fechá-la sem salvar o arquivo
          ou imprimir, eles se perdem. São dados pessoais sensíveis de saúde (LGPD); guarde o
          arquivo salvo e o PDF em local protegido.
        </p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {PASSOS.map(({ Icone, texto }, i) => (
            <li key={texto} className="flex gap-3 text-sm leading-snug text-foreground">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-brand-black">
                <Icone className="size-4" aria-hidden />
                <span className="sr-only">Passo {i + 1}:</span>
              </span>
              <span>{texto}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="lista-formularios" className="space-y-4">
        <h2 id="lista-formularios" className="text-xl text-foreground">
          Escolha o formulário
        </h2>
        <ul className="grid gap-4">
          {todosOsFormularios().map((f) => {
            const Icone = ICONES[f.id];
            return (
              <li key={f.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-yellow text-brand-black">
                    <Icone className="size-6" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="text-xl leading-tight text-foreground">{f.nome}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.paginas.length} páginas · {f.profissional} · {f.sigilo}
                    </p>
                  </div>
                  <Button asChild className="min-h-11 w-full gap-2 rounded-full px-5 sm:w-auto">
                    <Link to="/formularios-mefe/$tipo" params={{ tipo: f.id }}>
                      Abrir formulário <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
