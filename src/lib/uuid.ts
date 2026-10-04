const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Formato canônico de UUID (8-4-4-4-12). Barra entradas inválidas antes de chegarem ao Postgres. */
export function ehUuid(valor: unknown): valor is string {
  return typeof valor === "string" && RE_UUID.test(valor);
}
