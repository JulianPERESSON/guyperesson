import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductActions } from "@/components/commerce/product-actions";
import { DemoArtwork } from "@/components/ui/demo-artwork";
import { formatPrice } from "@/lib/site";
import type { CatalogProduct } from "@/types/catalog";
import { StatusBadge } from "./status-badge";

function artworkKind(category: CatalogProduct["categorySlug"]): "CERAMIC" | "MAGAZINE" | "POSTCARD" {
  if (category === "ceramique") return "CERAMIC";
  if (category === "revues-auto-moto") return "MAGAZINE";
  return "POSTCARD";
}

export function ProductCard({ product, priority = false }: { product: CatalogProduct; priority?: boolean }) {
  const unavailable = product.status !== "AVAILABLE" || product.quantity < 1;
  return <article className="group relative min-w-0 animate-reveal">
    <div className="relative overflow-hidden rounded-[1.15rem] bg-stone-200">
      <Link href={`/produits/${product.slug}`} aria-label={`Voir ${product.name}`} tabIndex={-1}>
        <DemoArtwork kind={artworkKind(product.categorySlug)} title={product.name} className="aspect-[4/5] transition duration-500 group-hover:scale-[1.025]" priorityLabel={priority ? "Sélection" : undefined} />
      </Link>
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5"><StatusBadge status={product.status} />{product.rareItem && <span className="rounded-full bg-[#a35f3f] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-white">Rare</span>}</div>
      <div className="absolute bottom-3 right-3 translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"><ProductActions productId={product.id} disabled={unavailable} compact /></div>
    </div>
    <div className="px-1 pt-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-stone-500">{product.subcategory} · {product.estimatedYear ?? product.period}</p><h3 className="mt-1.5 text-xl leading-tight"><Link href={`/produits/${product.slug}`} className="after:absolute after:inset-0 after:-z-10 hover:text-[#173f35]">{product.name}</Link></h3></div><ArrowUpRight className="mt-1 shrink-0 text-stone-400 transition group-hover:text-[#173f35]" size={17}/></div>
      <div className="mt-3 flex items-baseline gap-2"><span className={`text-sm font-bold ${product.status === "SOLD" ? "text-stone-500 line-through" : "text-[#173f35]"}`}>{formatPrice(product.price)}</span>{product.previousPrice && <span className="text-xs text-stone-400 line-through">{formatPrice(product.previousPrice)}</span>}</div>
    </div>
  </article>;
}

export function ProductCardList({ product }: { product: CatalogProduct }) {
  const unavailable = product.status !== "AVAILABLE" || product.quantity < 1;
  return <article className="surface grid gap-5 p-3 sm:grid-cols-[11rem_1fr_auto] sm:items-center sm:p-4"><Link href={`/produits/${product.slug}`}><DemoArtwork kind={artworkKind(product.categorySlug)} title={product.name} className="aspect-[4/3] rounded-xl sm:aspect-square" /></Link><div><div className="flex flex-wrap gap-2"><StatusBadge status={product.status}/><span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{product.reference}</span></div><h3 className="mt-3 text-2xl"><Link href={`/produits/${product.slug}`} className="hover:text-[#173f35]">{product.name}</Link></h3><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{product.shortDescription}</p><p className="mt-3 text-sm text-stone-500">{product.period} · {product.country}{product.city ? `, ${product.city}` : ""}</p></div><div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end"><p className="text-base font-bold text-[#173f35]">{formatPrice(product.price)}</p><ProductActions productId={product.id} disabled={unavailable} compact /></div></article>;
}
