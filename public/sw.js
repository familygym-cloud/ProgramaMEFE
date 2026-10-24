// Service worker da Family Gym. Faz só duas coisas, de propósito:
//  1) guarda arquivos estáticos do site (scripts, estilos, fontes, ícones) para abrir mais rápido;
//  2) se a pessoa abrir uma página sem internet, mostra /offline.html (treino do dia salvo no aparelho).
// Nunca guarda páginas, chamadas à API nem dados de login: nada de conta fica no cache do navegador.
const VERSAO = "fg-v1";
const ESTATICOS = `${VERSAO}-estaticos`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(ESTATICOS)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icon-192.png", "/favicon.svg"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(nomes.filter((n) => !n.startsWith(VERSAO)).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

function ehEstatico(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/fonts/") ||
      /\.(?:png|svg|webp|jpg|jpeg|ico|woff2?|otf)$/i.test(url.pathname))
  );
}

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);

  // Páginas: rede primeiro; sem rede, a página offline.
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido).catch(() => caches.match(OFFLINE_URL).then((r) => r ?? Response.error())),
    );
    return;
  }

  // Estáticos: do cache se houver (e atualiza em segundo plano).
  if (ehEstatico(url)) {
    evento.respondWith(
      caches.open(ESTATICOS).then(async (cache) => {
        const guardado = await cache.match(pedido);
        const rede = fetch(pedido)
          .then((resposta) => {
            if (resposta.ok) cache.put(pedido, resposta.clone());
            return resposta;
          })
          .catch(() => guardado);
        return guardado ?? rede;
      }),
    );
  }
});
