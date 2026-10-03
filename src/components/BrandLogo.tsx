import logo from "@/assets/family-gym-logo.jpg.asset.json";

export function BrandLogo({ className = "h-14" }: { className?: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded-2xl bg-brand-onblack p-2 shadow-lg ring-1 ring-brand-yellow/40">
      <img
        src={logo.url}
        alt="Logo da Academia Family Gym"
        className={`${className} w-auto object-contain`}
        loading="lazy"
      />
    </span>
  );
}
