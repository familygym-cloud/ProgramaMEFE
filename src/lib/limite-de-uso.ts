// Limite de uso por janela fixa, na memória do servidor. É uma proteção básica contra abuso (robôs
// no formulário, chave vazada em laço): cada instância do Worker conta por conta própria, então o
// limite real pode ser até algumas vezes maior. Para um teto global, use também uma regra de Rate
// Limiting na Cloudflare (veja docs/configuracao-de-producao.md).

type Janela = { inicio: number; usos: number };

export type ResultadoDoLimite = { permitido: true } | { permitido: false; esperarSegundos: number };

export class LimiteDeUso {
  private readonly janelas = new Map<string, Janela>();

  constructor(
    private readonly maximo: number,
    private readonly janelaMs: number,
    private readonly tamanhoMaximo = 5000,
  ) {}

  usar(chave: string, agora: number = Date.now()): ResultadoDoLimite {
    const atual = this.janelas.get(chave);
    if (!atual || agora - atual.inicio >= this.janelaMs) {
      if (this.janelas.size >= this.tamanhoMaximo) this.limpar(agora);
      this.janelas.set(chave, { inicio: agora, usos: 1 });
      return { permitido: true };
    }
    if (atual.usos < this.maximo) {
      atual.usos += 1;
      return { permitido: true };
    }
    return {
      permitido: false,
      esperarSegundos: Math.max(1, Math.ceil((atual.inicio + this.janelaMs - agora) / 1000)),
    };
  }

  private limpar(agora: number) {
    for (const [chave, j] of this.janelas)
      if (agora - j.inicio >= this.janelaMs) this.janelas.delete(chave);
    // Ainda cheio (ataque com muitos endereços): descarta o mais antigo para não crescer sem fim.
    if (this.janelas.size >= this.tamanhoMaximo) {
      const primeira = this.janelas.keys().next();
      if (!primeira.done) this.janelas.delete(primeira.value);
    }
  }
}

/** Endereço de quem chamou (a Cloudflare preenche cf-connecting-ip), ou "desconhecido". */
export function enderecoDe(headers: Headers): string {
  const ip = headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0];
  return ip?.trim().slice(0, 64) || "desconhecido";
}
