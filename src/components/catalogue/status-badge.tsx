import type { ProductStatus } from "@/types/catalog";

const styles: Record<ProductStatus, string> = {
  AVAILABLE: "bg-emerald-900 text-white",
  RESERVED: "bg-amber-100 text-amber-950",
  SOLD: "bg-stone-800 text-white",
  UNAVAILABLE: "bg-stone-200 text-stone-700",
  COMING_SOON: "bg-sky-100 text-sky-950",
};
const labels: Record<ProductStatus, string> = { AVAILABLE: "Disponible", RESERVED: "Réservé", SOLD: "Vendu", UNAVAILABLE: "Indisponible", COMING_SOON: "Bientôt disponible" };

export function StatusBadge({ status, className = "" }: { status: ProductStatus; className?: string }) { return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] ${styles[status]} ${className}`}>{labels[status]}</span>; }
