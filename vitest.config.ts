import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Configuração própria de testes: não carrega o plugin do TanStack Start/Nitro,
// pois os testes cobrem apenas lógica pura (src/lib).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
