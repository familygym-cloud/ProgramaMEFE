/**
 * Ligação do armazém em memória (src/lib/formularios/estado.ts) com o React. Cada controle assina o
 * armazém e relê SÓ o valor da sua chave; digitar em um campo não refaz as outras centenas de campos.
 */
import { createContext, useContext, useSyncExternalStore } from "react";
import type { Armazem } from "@/lib/formularios/estado";
import type { Alerta } from "@/lib/formularios/tipos";

export const ContextoArmazem = createContext<Armazem | null>(null);

export function useArmazem(): Armazem {
  const armazem = useContext(ContextoArmazem);
  if (armazem === null) throw new Error("Formulário usado fora do provedor do armazém.");
  return armazem;
}

/** Valor guardado (digitado/marcado). undefined se ninguém mexeu. */
export function useGuardado(chave: string): string | undefined {
  const a = useArmazem();
  const ler = () => a.obter(chave);
  return useSyncExternalStore(a.assinar, ler, ler);
}

/** Valor calculado da chave (undefined se não há cálculo ou faltam dados). Chave undefined = não assina nada útil. */
export function useCalculado(chave: string | undefined): string | undefined {
  const a = useArmazem();
  const ler = () => (chave === undefined ? undefined : a.derivados()[chave]?.valor);
  return useSyncExternalStore(a.assinar, ler, ler);
}

export function useNotaCalculada(chave: string | undefined): string | undefined {
  const a = useArmazem();
  const ler = () => (chave === undefined ? undefined : a.derivados()[chave]?.nota);
  return useSyncExternalStore(a.assinar, ler, ler);
}

export function useAlertas(): readonly Alerta[] {
  const a = useArmazem();
  const ler = () => a.alertas();
  return useSyncExternalStore(a.assinar, ler, ler);
}

export function useSujo(): boolean {
  const a = useArmazem();
  const ler = () => a.sujo();
  return useSyncExternalStore(a.assinar, ler, ler);
}

export interface EstadoDoCampo {
  /** O que a tela mostra: o digitado ou, se ninguém editou, o calculado. */
  readonly exibido: string;
  readonly calculado: string | undefined;
  readonly guardado: string | undefined;
  /** Há cálculo para esta chave e o valor mostrado é o automático. */
  readonly automatico: boolean;
  /** Há cálculo e o profissional digitou/escolheu outra coisa. */
  readonly editado: boolean;
  readonly nota: string | undefined;
  /** Grava o valor. Em campo de texto calculado, apagar tudo volta ao cálculo automático. */
  readonly mudar: (valor: string) => void;
  /** Grava o valor mesmo vazio (usado pelos grupos de opção: "nenhuma" é uma escolha válida). */
  readonly definirExato: (valor: string) => void;
  readonly restaurar: () => void;
}

export function useCampo(chave: string, temCalculo: boolean): EstadoDoCampo {
  const armazem = useArmazem();
  const guardado = useGuardado(chave);
  const calculado = useCalculado(temCalculo ? chave : undefined);
  const nota = useNotaCalculada(temCalculo ? chave : undefined);
  const exibido = guardado ?? calculado ?? "";
  return {
    exibido,
    calculado,
    guardado,
    automatico: temCalculo && guardado === undefined && calculado !== undefined && calculado !== "",
    editado: temCalculo && guardado !== undefined && guardado !== (calculado ?? ""),
    nota,
    mudar: (valor) => {
      if (temCalculo && valor === "") armazem.restaurar(chave);
      else armazem.definir(chave, valor);
    },
    definirExato: (valor) => armazem.definir(chave, valor),
    restaurar: () => armazem.restaurar(chave),
  };
}
