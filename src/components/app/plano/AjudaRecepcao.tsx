import { HeartHandshake } from "lucide-react";
import { Superficie } from "@/components/app/ui";

export function AjudaRecepcao() {
  return (
    <Superficie className="flex flex-col gap-4">
      <span
        aria-hidden
        className="grid size-11 place-items-center rounded-2xl bg-brand-yellow/10 text-brand-yellow [&_svg]:size-5"
      >
        <HeartHandshake />
      </span>
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-semibold leading-tight">
          Dúvidas sobre o seu plano?
        </h2>
        <p className="text-sm text-muted-foreground">
          Para tirar dúvidas sobre mensalidades, trocar de plano ou renovar o termo, fale com a
          recepção da Family Gym. Estamos aqui para ajudar.
        </p>
      </div>
    </Superficie>
  );
}
