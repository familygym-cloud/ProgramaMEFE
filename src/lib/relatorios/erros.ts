// Falhas ao carregar os relatórios, em linguagem de gente. O texto cru do servidor (muitas vezes em
// inglês ou técnico) nunca vai para a tela; só entra aqui para decidir qual orientação dar.

export type TipoErroRelatorio = "sessao" | "permissao" | "rede" | "generico";

export type ErroRelatorio = { tipo: TipoErroRelatorio; mensagem: string };

function textoDoErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message;
  if (typeof erro === "string") return erro;
  if (erro && typeof erro === "object" && "message" in erro) return String(erro.message);
  return "";
}

export function classificarErro(erro: unknown): ErroRelatorio {
  const texto = textoDoErro(erro).toLowerCase();

  if (/unauthori[sz]ed|invalid token|jwt|not authenticated|sess[aã]o/.test(texto)) {
    return {
      tipo: "sessao",
      mensagem: "Sua sessão expirou. Entre de novo para continuar.",
    };
  }
  if (/apenas a equipe|staff|permiss|forbidden|row-level security/.test(texto)) {
    return {
      tipo: "permissao",
      mensagem: "Seu acesso não permite ver os relatórios da equipe.",
    };
  }
  if (
    /failed to fetch|networkerror|network request|load failed|timeout|timed out|offline/.test(texto)
  ) {
    return {
      tipo: "rede",
      mensagem: "Não foi possível falar com o servidor. Verifique a internet e tente de novo.",
    };
  }
  return {
    tipo: "generico",
    mensagem: "Algo deu errado ao buscar os dados. Tente de novo em instantes.",
  };
}
