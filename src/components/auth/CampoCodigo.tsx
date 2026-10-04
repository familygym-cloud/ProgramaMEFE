import { useEffect, useRef } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { TAMANHO_CODIGO } from "@/lib/auth-mfa";
import { cn } from "@/lib/utils";

/** Seis dígitos em dois grupos de três, com autopreenchimento do SMS/teclado e envio automático ao completar. */
export function CampoCodigo({
  valor,
  aoMudar,
  aoCompletar,
  desabilitado = false,
  invalido = false,
  autoFocar = false,
  rotulo = "Código de verificação de 6 dígitos",
}: {
  valor: string;
  aoMudar: (valor: string) => void;
  aoCompletar?: (valor: string) => void;
  desabilitado?: boolean;
  invalido?: boolean;
  autoFocar?: boolean;
  rotulo?: string;
}) {
  // Um campo desabilitado perde o foco; ao ser liberado depois de um envio, devolvemos o foco para tentar de novo.
  const entrada = useRef<HTMLInputElement>(null);
  const estavaDesabilitado = useRef(desabilitado);
  useEffect(() => {
    if (estavaDesabilitado.current && !desabilitado) entrada.current?.focus();
    estavaDesabilitado.current = desabilitado;
  }, [desabilitado]);

  const slot = (indice: number) => (
    <InputOTPSlot
      key={indice}
      index={indice}
      className={cn(
        "h-14 w-10 rounded-xl border border-input bg-foreground/[0.04] font-display text-2xl font-semibold first:rounded-xl first:border last:rounded-xl sm:w-12",
        invalido && "border-destructive/70",
        // O slot ativo recebe a classe z-10 do componente base; usamos isso para destacá-lo.
        "[&.z-10]:border-brand-yellow [&.z-10]:ring-2 [&.z-10]:ring-brand-yellow/40",
      )}
    />
  );

  return (
    <InputOTP
      ref={entrada}
      maxLength={TAMANHO_CODIGO}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      value={valor}
      onChange={aoMudar}
      {...(aoCompletar ? { onComplete: aoCompletar } : {})}
      disabled={desabilitado}
      autoFocus={autoFocar}
      aria-label={rotulo}
      aria-invalid={invalido || undefined}
      containerClassName="justify-center gap-2.5"
    >
      <InputOTPGroup className="gap-1.5 sm:gap-2">{[0, 1, 2].map(slot)}</InputOTPGroup>
      <InputOTPSeparator className="text-foreground/30 [&_svg]:size-3.5" />
      <InputOTPGroup className="gap-1.5 sm:gap-2">{[3, 4, 5].map(slot)}</InputOTPGroup>
    </InputOTP>
  );
}
