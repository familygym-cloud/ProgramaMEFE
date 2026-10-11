import { MapPin } from "lucide-react";
import { contatoDaAcademia, dividirEndereco, MENSAGEM_CONTATO } from "@/lib/site";
import { ComoChegar } from "./ComoChegar";
import { FaleConosco } from "./FaleConosco";
import { DadosDeContato } from "./Matricular";
import { CabecalhoSecao, Secao } from "./SecaoSite";

/**
 * Mapa desenhado à mão (SVG), só na paleta da marca: não é um mapa de verdade. Não carrega
 * biblioteca, imagem nem iframe de terceiros, então não manda dados de ninguém para fora nem pesa
 * na página. A rota de verdade abre no aplicativo escolhido em "Como chegar".
 */
function MapaDecorativo({ bairro }: { bairro: string }) {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-foreground/10 bg-card"
    >
      <svg
        viewBox="0 0 480 360"
        className="absolute inset-0 size-full"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {/* Quarteirões: tudo é fundo; as ruas "recortam" o fundo com a cor do cartão. */}
        <rect width="480" height="360" className="fill-foreground/[0.06]" />
        {/* Praça no quarteirão que a rota contorna. */}
        <rect x="222" y="184" width="96" height="74" rx="14" className="fill-brand-yellow/[0.12]" />
        <g className="stroke-card" strokeLinecap="round">
          <path d="M90 -10 V370" strokeWidth="12" />
          <path d="M210 -10 V370" strokeWidth="16" />
          <path d="M330 -10 V370" strokeWidth="12" />
          <path d="M430 -10 V370" strokeWidth="8" />
          <path d="M-10 70 H490" strokeWidth="8" />
          <path d="M-10 170 H490" strokeWidth="16" />
          <path d="M-10 270 H490" strokeWidth="12" />
          <path d="M-10 330 L490 20" strokeWidth="10" />
        </g>
        {/* Eixo das avenidas principais. */}
        <g
          className="stroke-foreground/20"
          strokeWidth="1.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
        >
          <path d="M210 -10 V370" />
          <path d="M-10 170 H490" />
        </g>

        {/* Rota até a academia. */}
        <path
          d="M90 322 V270 H210 V170 H330"
          fill="none"
          className="stroke-brand-yellow"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 11"
        />
        <circle cx="90" cy="322" r="9" className="fill-card stroke-brand-yellow" strokeWidth="4" />

        {/* Alfinete da academia. */}
        <circle
          cx="330"
          cy="170"
          r="16"
          className="fill-brand-yellow/30 [transform-box:fill-box] [transform-origin:center] motion-safe:animate-ping"
        />
        <ellipse cx="330" cy="172" rx="9" ry="3.5" className="fill-foreground/25" />
        <g transform="translate(330 170)">
          <path
            d="M0 0 C-9 -12 -17 -21 -17 -32 a17 17 0 1 1 34 0 c0 11 -8 20 -17 32z"
            className="fill-brand-yellow"
          />
          <circle cy="-32" r="6.5" className="fill-brand-black" />
        </g>
      </svg>

      {bairro ? (
        <span className="absolute left-4 top-4 inline-flex items-center rounded-full border border-foreground/10 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur">
          {bairro}
        </span>
      ) : null}
      <div className="absolute bottom-4 right-4 hidden items-center gap-3 rounded-2xl border border-foreground/10 bg-background/85 p-3 pr-5 backdrop-blur sm:flex">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-yellow text-brand-black">
          <MapPin className="size-5" />
        </span>
        <p className="text-sm font-semibold leading-tight">Academia Family Gym</p>
      </div>
    </div>
  );
}

/** "Onde estamos": endereço, WhatsApp, mapa ilustrado e os botões Como chegar e Fale conosco. */
export function SecaoOndeEstamos() {
  const { endereco, whatsapp, telefone } = contatoDaAcademia;
  if (!endereco && !whatsapp && !telefone) return null;
  const bairro = endereco ? (dividirEndereco(endereco).complemento.split(",")[0] ?? "").trim() : "";

  return (
    <Secao id="onde-estamos" rotulo="Onde estamos" className="border-t border-foreground/10">
      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="space-y-8">
          <CabecalhoSecao
            eyebrow="Onde estamos"
            titulo="Venha treinar com a gente"
            texto="Toque em Como chegar para abrir a rota no aplicativo de mapa que você preferir, ou fale com a recepção pelo WhatsApp."
          />
          <DadosDeContato mensagem={MENSAGEM_CONTATO} />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ComoChegar variante="primario" tamanho="lg" />
            <FaleConosco variante="secundario" tamanho="lg" />
          </div>
        </div>
        <MapaDecorativo bairro={bairro} />
      </div>
    </Secao>
  );
}
