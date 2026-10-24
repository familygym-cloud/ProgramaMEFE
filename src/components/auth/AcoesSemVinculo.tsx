import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, LogOut, MessageCircle } from "lucide-react";
import { botaoMarca } from "@/components/site/botoes";
import { supabase } from "@/integrations/supabase/client";
import { mensagemParaRecepcao } from "@/lib/auth-contato";
import { contatoDaAcademia, destinoFaleConosco } from "@/lib/site";

/** Saídas da tela "conta sem vínculo": falar com a recepção, sair da conta e voltar ao site. */
export function AcoesSemVinculo() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    let ativo = true;
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (ativo) setEmail(data.user?.email ?? null);
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, []);

  const recepcao = destinoFaleConosco(contatoDaAcademia, mensagemParaRecepcao(email));

  async function sair() {
    setSaindo(true);
    try {
      await supabase.auth.signOut();
    } finally {
      await navigate({ to: "/auth", replace: true });
    }
  }

  return (
    <div className="mt-2 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
      {recepcao ? (
        <a
          href={recepcao}
          className={botaoMarca("primario", "md")}
          {...(recepcao.startsWith("https://")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          <MessageCircle aria-hidden />
          Falar com a recepção
          {recepcao.startsWith("https://") ? (
            <span className="sr-only"> (abre o WhatsApp em outra aba)</span>
          ) : null}
        </a>
      ) : null}
      <button
        type="button"
        onClick={sair}
        disabled={saindo}
        className={botaoMarca("secundario", "md", "disabled:opacity-60")}
      >
        {saindo ? <Loader2 aria-hidden className="animate-spin" /> : <LogOut aria-hidden />}
        Sair
      </button>
      <Link to="/" className={botaoMarca("fantasma", "md")}>
        <ArrowLeft aria-hidden />
        Voltar ao site
      </Link>
    </div>
  );
}
