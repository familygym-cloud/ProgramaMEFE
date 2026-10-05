// Contagem regressiva do "Reenviar e-mail": o Supabase limita os envios por pessoa, então o botão
// só volta a funcionar depois de um intervalo. Trabalhamos com o instante em que o botão libera
// (e não com um contador que decresce), para a conta continuar certa mesmo se o navegador atrasar
// o relógio da aba em segundo plano.

/** Intervalo mínimo entre dois envios de e-mail pelo app, em segundos. */
export const INTERVALO_REENVIO_SEGUNDOS = 60;

/** Instante (ms) em que o reenvio é liberado, contando a partir de `agora`. */
export function liberarReenvioEm(agora: number, segundos = INTERVALO_REENVIO_SEGUNDOS): number {
  return agora + Math.max(0, segundos) * 1000;
}

/** Segundos que faltam (arredondados para cima, nunca negativos) até o instante `liberaEm`. */
export function segundosRestantes(liberaEm: number, agora: number): number {
  return Math.max(0, Math.ceil((liberaEm - agora) / 1000));
}

/** Texto do botão de reenvio: mostra a contagem enquanto estiver bloqueado. */
export function rotuloReenvio(restantes: number, enviando: boolean): string {
  if (enviando) return "Enviando...";
  if (restantes > 0) return `Reenviar e-mail em ${restantes} s`;
  return "Reenviar e-mail";
}
