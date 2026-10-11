import type { AreaAlunoDados, Treino } from "@/lib/aluno-app/types";

// Aplicativo instalável e treino offline. Tudo é opcional: se o navegador não suportar, nada muda.

const CHAVE_TREINOS = "fg:treinos-offline";

export type TreinosOffline = { atualizadoEm: string; treinos: Treino[] };

/** Só o necessário para treinar sem internet: fichas e exercícios, sem dados pessoais ou financeiros. */
export function montarTreinosOffline(
  dados: Pick<AreaAlunoDados, "treinos">,
  agora: Date = new Date(),
): TreinosOffline {
  return { atualizadoEm: agora.toISOString(), treinos: dados.treinos };
}

export function salvarTreinosOffline(dados: Pick<AreaAlunoDados, "treinos" | "demo">): void {
  if (dados.demo) return;
  try {
    window.localStorage.setItem(CHAVE_TREINOS, JSON.stringify(montarTreinosOffline(dados)));
  } catch {
    // Sem armazenamento: o treino só não fica disponível offline.
  }
}

/** Ao sair da conta, nada do aluno fica guardado no aparelho. */
export function limparDadosOffline(): void {
  try {
    window.localStorage.removeItem(CHAVE_TREINOS);
  } catch {
    // Sem armazenamento: nada a limpar.
  }
}

/** Registra o service worker (só em produção; em desenvolvimento ele atrapalharia o recarregamento). */
export function registrarServiceWorker(): void {
  if (
    !import.meta.env.PROD ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let eventoGuardado: EventoInstalacao | null = null;
const ouvintes = new Set<() => void>();

export function ouvirInstalacao(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    eventoGuardado = e as EventoInstalacao;
    ouvintes.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    eventoGuardado = null;
    ouvintes.forEach((fn) => fn());
  });
}

export function podeInstalar(): boolean {
  return eventoGuardado !== null;
}

export function aoMudarInstalacao(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export async function instalarApp(): Promise<boolean> {
  if (!eventoGuardado) return false;
  await eventoGuardado.prompt();
  const { outcome } = await eventoGuardado.userChoice;
  eventoGuardado = null;
  ouvintes.forEach((fn) => fn());
  return outcome === "accepted";
}

/** iPhone e iPad não têm o botão de instalar: a instalação é pelo menu Compartilhar do Safari. */
export function ehIos(
  agente: string = typeof navigator === "undefined" ? "" : navigator.userAgent,
): boolean {
  return /iPad|iPhone|iPod/.test(agente);
}

export function jaInstalado(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
