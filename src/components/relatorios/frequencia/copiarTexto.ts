/**
 * Copia um texto para a área de transferência. Usa a API moderna e, onde ela não existe ou é
 * negada (página sem HTTPS, navegadores antigos), cai num campo de texto temporário. Devolve
 * false quando nenhum dos dois caminhos funcionou.
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return copiarPeloCampoTemporario(texto);
  }
}

function copiarPeloCampoTemporario(texto: string): boolean {
  if (typeof document === "undefined") return false;
  const campo = document.createElement("textarea");
  campo.value = texto;
  campo.setAttribute("readonly", "");
  // Fora da tela e sem zoom no iOS (fonte >= 16px); o foco anterior volta ao fim.
  campo.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0;font-size:16px";
  const focoAnterior =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.appendChild(campo);
  try {
    campo.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    campo.remove();
    focoAnterior?.focus({ preventScroll: true });
  }
}
