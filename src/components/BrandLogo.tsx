import principalBranco from "@/assets/brand/principal-branco.svg";
import principalPreto from "@/assets/brand/principal-preto.svg";
import secundarioBranco from "@/assets/brand/secundario-branco.svg";
import secundarioPreto from "@/assets/brand/secundario-preto.svg";
import verticalBranco from "@/assets/brand/vertical-branco.svg";
import verticalPreto from "@/assets/brand/vertical-preto.svg";
import marcaBranco from "@/assets/brand/marca-branco.svg";
import marcaPreto from "@/assets/brand/marca-preto.svg";
import { cn } from "@/lib/utils";

const LOGOS = {
  principal: { branco: principalBranco, preto: principalPreto },
  secundario: { branco: secundarioBranco, preto: secundarioPreto },
  vertical: { branco: verticalBranco, preto: verticalPreto },
  marca: { branco: marcaBranco, preto: marcaPreto },
} as const;

export type VarianteLogo = keyof typeof LOGOS;

/**
 * Logos oficiais da Family Gym.
 * - principal: horizontal (menus e cabeçalhos)
 * - secundario: compacto, símbolo acima do nome
 * - vertical: símbolo grande com nome empilhado (capas e login)
 * - marca: somente o símbolo (ícones e espaços pequenos)
 * `tom` é a cor do desenho: "branco" para fundos escuros, "preto" para fundos claros.
 */
export function BrandLogo({
  variante = "principal",
  tom = "branco",
  className = "h-10",
}: {
  variante?: VarianteLogo;
  tom?: "branco" | "preto";
  className?: string;
}) {
  return (
    <img
      src={LOGOS[variante][tom]}
      alt="Family Gym"
      className={cn("w-auto select-none object-contain", className)}
      draggable={false}
    />
  );
}
