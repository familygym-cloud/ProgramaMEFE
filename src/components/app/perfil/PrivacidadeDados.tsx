import { Link } from "@tanstack/react-router";
import { ArrowRight, Eye, HeartHandshake, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Superficie } from "@/components/app/ui";

function Ponto({
  icone,
  titulo,
  children,
}: {
  icone: ReactNode;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3.5">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-muted-foreground [&_svg]:size-[1.15rem]"
      >
        {icone}
      </span>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <div className="space-y-1 text-sm text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}

export function PrivacidadeDados() {
  return (
    <Superficie as="section" className="space-y-6">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow [&_svg]:size-5"
        >
          <ShieldCheck />
        </span>
        <div className="space-y-1.5">
          <h2 className="font-display text-xl font-semibold leading-tight">Seus dados são seus</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            A LGPD (Lei Geral de Proteção de Dados) garante a você direitos sobre os seus dados
            pessoais. Seus dados de saúde, como peso, medidas e avaliações, só são vistos por você e
            pela equipe da Family Gym.
          </p>
        </div>
      </div>

      <ul className="grid gap-5 md:grid-cols-3 md:gap-6">
        <Ponto icone={<Eye />} titulo="Tudo à vista">
          <p>
            O que está registrado sobre você aparece nesta área, e você pode conferir quando quiser.
          </p>
        </Ponto>
        <Ponto icone={<HeartHandshake />} titulo="Algo errado ou alguma dúvida?">
          <p>
            Fale com a recepção para corrigir dados do cadastro ou tirar dúvidas sobre suas
            informações.
          </p>
        </Ponto>
        <Ponto icone={<ShieldCheck />} titulo="Cuide também do acesso">
          <p>Veja as opções para proteger o acesso à sua conta.</p>
          <Link
            to="/app/seguranca"
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline underline-offset-4 hover:text-brand-yellow"
          >
            Ir para Segurança <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Ponto>
      </ul>
    </Superficie>
  );
}
