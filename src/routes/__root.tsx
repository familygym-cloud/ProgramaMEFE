import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { reagirAoEventoDeAuth } from "../lib/auth-sessao";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { urlAbsoluta } from "../lib/site";

const NOME_DO_SITE = "Academia Family Gym";
const DESCRICAO_CURTA = "Saúde integral e evolução dos alunos.";
const IMAGEM_COMPARTILHAMENTO = urlAbsoluta("/og-image.png") ?? "/og-image.png";
const TEXTO_DA_IMAGEM =
  "Logo Family Gym sobre fundo preto, com o lema Treine em família. Evolua sempre.";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Tente atualizar a página ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: NOME_DO_SITE },
      {
        name: "description",
        content: "Academia Family Gym — saúde integral e evolução dos alunos.",
      },
      { name: "author", content: NOME_DO_SITE },
      { property: "og:site_name", content: NOME_DO_SITE },
      { property: "og:title", content: NOME_DO_SITE },
      { property: "og:description", content: DESCRICAO_CURTA },
      { property: "og:type", content: "website" },
      { property: "og:image", content: IMAGEM_COMPARTILHAMENTO },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: TEXTO_DA_IMAGEM },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: NOME_DO_SITE },
      { name: "twitter:description", content: DESCRICAO_CURTA },
      { name: "twitter:image", content: IMAGEM_COMPARTILHAMENTO },
      { name: "twitter:image:alt", content: TEXTO_DA_IMAGEM },
      { name: "theme-color", content: "#151515" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "64x64", href: "/favicon.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    let cancelado = false;
    let cancelarAssinatura: (() => void) | undefined;
    // null = ninguém logado; undefined = ainda não sabemos (antes do INITIAL_SESSION).
    let usuarioId: string | null | undefined;

    // O import dinâmico mantém o supabase-js fora do caminho crítico das páginas públicas. Como a
    // assinatura só existe depois dele, o cleanup precisa lembrar que já foi chamado: sem isso, um
    // efeito desfeito antes de o módulo carregar (StrictMode, troca de router) deixaria um ouvinte
    // órfão para sempre.
    import("@/integrations/supabase/client")
      .then(({ supabase }) => {
        if (cancelado) return;
        const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
          const decisao = reagirAoEventoDeAuth(evento, usuarioId, sessao?.user.id ?? null);
          usuarioId = decisao.usuarioId;
          if (decisao.acao === "limpar") {
            // O cache guarda dados pessoais (alunos, pagamentos, medidas). Se a sessão acabou por
            // outro caminho que o botão "Sair" (outra aba, token revogado), ele não pode sobrar para
            // a próxima pessoa que usar este navegador.
            void queryClient.cancelQueries();
            queryClient.clear();
            void router.invalidate();
          } else if (decisao.acao === "atualizar") {
            void router.invalidate();
            void queryClient.invalidateQueries();
          }
        });
        cancelarAssinatura = () => data.subscription.unsubscribe();
      })
      // Sem as variáveis do Supabase o cliente já registrou o erro; as páginas públicas seguem de pé.
      .catch(() => undefined);

    return () => {
      cancelado = true;
      cancelarAssinatura?.();
    };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
