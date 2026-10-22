import { createFileRoute } from "@tanstack/react-router";
import { hojeBrasilia } from "@/lib/datas";
import { montarSitemap } from "@/lib/seo";
import { urlDoSite } from "@/lib/site";

/** Mapa do site para o Google. Sem VITE_SITE_URL não há como montar endereços absolutos: responde 404. */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const base = urlDoSite();
        if (!base)
          return new Response("Defina VITE_SITE_URL para gerar o mapa do site.", { status: 404 });
        return new Response(montarSitemap(base, hojeBrasilia()), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
