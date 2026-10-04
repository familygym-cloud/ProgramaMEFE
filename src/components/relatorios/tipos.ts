import type { ModoRelatorio } from "@/lib/relatorios/abas";
import type { RelatorioGeral } from "@/lib/relatorios/types";

/** Props de toda aba da Central. */
export type PropsAba = {
  relatorio: RelatorioGeral;
  /** "demo" = dados fictícios; os arquivos exportados levam "demo" no nome. */
  modo: ModoRelatorio;
};
