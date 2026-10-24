import { createFileRoute } from "@tanstack/react-router";
import { montarRobots } from "@/lib/seo";
import { urlDoSite } from "@/lib/site";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(montarRobots(urlDoSite()), {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});
