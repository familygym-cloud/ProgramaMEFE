import type { ReactNode } from "react";
import {
  BadgeCheck,
  CalendarHeart,
  Clock,
  HeartHandshake,
  Hourglass,
  Lock,
  Ruler,
  StickyNote,
  Target,
} from "lucide-react";
import { Selo, Superficie } from "@/components/app/ui";
import { dataPorExtenso } from "@/components/app/avaliacoes/avaliacoes";
import type { PerfilAluno } from "@/lib/aluno-app/types";
import { cn } from "@/lib/utils";
import { alturaEmMetros } from "./formatar";

function Dado({
  icone,
  rotulo,
  children,
  largo = false,
}: {
  icone: ReactNode;
  rotulo: string;
  children: ReactNode;
  largo?: boolean;
}) {
  return (
    // dt e dd precisam ser filhos diretos do div (HTML válido e leitura correta por leitores de tela):
    // o ícone fica dentro do dt e o valor alinha com o rótulo pelo recuo do dd.
    <div className={cn("min-w-0", largo && "sm:col-span-2")}>
      <dt className="flex items-center gap-3.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground/[0.06] [&_svg]:size-[1.15rem]"
        >
          {icone}
        </span>
        {rotulo}
      </dt>
      <dd className="mt-1.5 break-words pl-[3.375rem] text-base font-medium leading-snug">
        {children}
      </dd>
    </div>
  );
}

const texto = (valor: string) => valor.trim() || "—";

/** Dados do cadastro, somente leitura: quem altera é a recepção. */
export function DadosCadastro({ perfil }: { perfil: PerfilAluno }) {
  const observacoes = perfil.observacoes.trim();

  return (
    <Superficie as="section" className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Dados do cadastro</h2>
        <Selo>
          <Lock className="size-3" aria-hidden />
          Somente leitura
        </Selo>
      </div>

      <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Dado icone={<BadgeCheck />} rotulo="Plano">
          {texto(perfil.plano)}
        </Dado>
        <Dado icone={<Clock />} rotulo="Turno">
          {texto(perfil.turno)}
        </Dado>
        <Dado icone={<Hourglass />} rotulo="Idade">
          {perfil.idade > 0 ? `${perfil.idade} anos` : "—"}
        </Dado>
        <Dado icone={<Ruler />} rotulo="Altura">
          {alturaEmMetros(perfil.altura)}
        </Dado>
        <Dado icone={<CalendarHeart />} rotulo="Membro desde" largo>
          {dataPorExtenso(perfil.membroDesde)}
        </Dado>
        <Dado icone={<Target />} rotulo="Objetivo" largo>
          {texto(perfil.objetivo)}
        </Dado>
        <Dado icone={<StickyNote />} rotulo="Observações" largo>
          {observacoes ? (
            <span className="whitespace-pre-line">{observacoes}</span>
          ) : (
            <span className="font-normal text-muted-foreground">
              Nenhuma observação registrada.
            </span>
          )}
        </Dado>
      </dl>

      <p className="mt-auto flex items-start gap-3 rounded-2xl border border-dashed border-foreground/15 px-4 py-3.5 text-sm text-muted-foreground">
        <HeartHandshake className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden />
        Para alterar nome, plano ou outros dados, fale com a recepção da Family Gym.
      </p>
    </Superficie>
  );
}
