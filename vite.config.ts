// Configuração do Vite: TanStack Start (SSR) + Tailwind + Nitro, que gera o Worker da Cloudflare em
// .output/ (publicar: `bun run deploy`). As variáveis VITE_* entram no pacote do navegador; os segredos
// do servidor (chave de serviço do Supabase) NUNCA usam esse prefixo.
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, mode }) => {
  const envPublico: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(loadEnv(mode, process.cwd(), "VITE_"))) {
    envPublico[`import.meta.env.${chave}`] = JSON.stringify(valor);
  }

  return {
    define: envPublico,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    server: { host: "::", port: 8080 },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
        // Entrada do servidor com o tratamento de erros de SSR (src/server.ts).
        server: { entry: "server" },
      }),
      // O Worker só é gerado no build; no `vite dev` o Nitro não participa.
      ...(command === "build"
        ? [
            nitro({
              preset: "cloudflare-module",
              // Cabeçalhos dos arquivos estáticos que não têm hash no nome (/assets/* já é imutável).
              // O service worker (/sw.js) fica de fora de propósito: precisa revalidar sempre.
              routeRules: {
                "/fonts/**": { headers: { "cache-control": "public, max-age=2592000" } },
                "/icon-*.png": { headers: { "cache-control": "public, max-age=604800" } },
                "/apple-touch-icon.png": { headers: { "cache-control": "public, max-age=604800" } },
                "/favicon.*": { headers: { "cache-control": "public, max-age=604800" } },
                "/og-image.png": { headers: { "cache-control": "public, max-age=604800" } },
                "/manifest.webmanifest": { headers: { "cache-control": "public, max-age=86400" } },
              },
              cloudflare: {
                nodeCompat: true,
                deployConfig: true,
                wrangler: { name: "familygym", observability: { enabled: true } },
              },
            }),
          ]
        : []),
      viteReact(),
    ],
  };
});
