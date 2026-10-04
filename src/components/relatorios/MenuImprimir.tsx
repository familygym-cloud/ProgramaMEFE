import { ChevronDown, FileText, Files, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type EscopoImpressao = "aba" | "completo";

/** "Imprimir / salvar PDF": a seção aberta ou o relatório completo (todas as seções, uma por folha). */
export function MenuImprimir({
  rotuloAba,
  aoImprimir,
}: {
  rotuloAba: string;
  aoImprimir: (escopo: EscopoImpressao) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          className="h-11 gap-2 rounded-full bg-brand-yellow px-5 font-semibold text-brand-black hover:bg-brand-yellow/90"
        >
          <Printer aria-hidden /> Imprimir / salvar PDF
          <ChevronDown aria-hidden className="-mr-1 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 rounded-2xl border-white/15 p-1.5 print:hidden"
      >
        <DropdownMenuItem
          onSelect={() => aoImprimir("aba")}
          className="min-h-11 cursor-pointer gap-3 rounded-xl px-3"
        >
          <FileText aria-hidden />
          <span className="flex flex-col">
            <span className="font-medium">Esta seção</span>
            <span className="text-xs text-muted-foreground">{rotuloAba}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => aoImprimir("completo")}
          className="min-h-11 cursor-pointer gap-3 rounded-xl px-3"
        >
          <Files aria-hidden />
          <span className="flex flex-col">
            <span className="font-medium">Relatório completo</span>
            <span className="text-xs text-muted-foreground">Todas as seções, uma por folha</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
