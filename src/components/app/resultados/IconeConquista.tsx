import {
  Award,
  CalendarCheck,
  CalendarHeart,
  Dumbbell,
  Flame,
  Medal,
  Scale,
  Sparkles,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONES: Record<string, LucideIcon> = {
  primeiro: Sparkles,
  "treinos-10": Dumbbell,
  "treinos-25": Medal,
  "treinos-50": Award,
  "treinos-100": Trophy,
  "seq-3": Flame,
  "seq-7": CalendarCheck,
  "mes-12": CalendarHeart,
  aulas: Users,
  "meta-peso": Target,
  avaliacoes: Scale,
};

/** Ícone de cada conquista; conquistas novas sem ícone próprio recebem a medalha. */
export function IconeConquista({ id, className }: { id: string; className?: string }) {
  const Icone = ICONES[id] ?? Medal;
  return <Icone className={className} aria-hidden />;
}
