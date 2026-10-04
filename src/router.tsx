import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { deveTentarNovamente } from "./lib/query-retry";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Sem `retry` próprio o React Query repete 3 vezes (cerca de 7 s) até mostrar até um erro que não
  // muda, como "Apenas a equipe pode...".
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: deveTentarNovamente } },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
