import { useEffect, useRef, useState } from "react";
import logoAsset from "@/assets/family-gym-logo.jpg.asset.json";

// Arquivo local opcional: basta colocar o logo em src/assets/family-gym-logo.(jpg|png|webp|svg).
const localLogos = import.meta.glob("@/assets/family-gym-logo.{jpg,jpeg,png,webp,svg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

// Ordem: arquivo local -> URL hospedada pelo Lovable -> wordmark em texto.
const sources = [...Object.values(localLogos), logoAsset.url];

export function BrandLogo({ className = "h-14" }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const src = sources[index];
  const imgRef = useRef<HTMLImageElement>(null);

  // Com SSR, o erro de carregamento pode ocorrer antes da hidratação e o onError se perde.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setIndex((i) => i + 1);
  }, [src]);

  return (
    <span className="inline-flex items-center justify-center rounded-2xl bg-brand-onblack p-2 shadow-lg ring-1 ring-brand-yellow/40">
      {src ? (
        <img
          key={src}
          ref={imgRef}
          src={src}
          alt="Logo da Academia Family Gym"
          className={`${className} w-auto object-contain`}
          loading="lazy"
          onError={() => setIndex((i) => i + 1)}
        />
      ) : (
        <span
          role="img"
          aria-label="Logo da Academia Family Gym"
          className={`${className} inline-flex items-center px-3 text-[0.9em] font-black italic uppercase leading-none tracking-tight text-black`}
          style={{ fontSize: "1.1rem" }}
        >
          Family&nbsp;<span className="text-brand-yellow">Gym</span>
        </span>
      )}
    </span>
  );
}
