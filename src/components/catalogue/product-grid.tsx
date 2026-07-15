import type { CatalogProduct } from "@/types/catalog";
import { ProductCard } from "./product-card";

export function ProductGrid({ products, className = "", emptyTitle = "Aucun objet ne correspond", emptyText = "Essayez d’élargir votre recherche ou de retirer un filtre." }: { products: readonly CatalogProduct[]; className?: string; emptyTitle?: string; emptyText?: string }) {
  if (!products.length) return <div className="surface grid min-h-72 place-items-center p-8 text-center"><div><p className="font-display text-3xl">{emptyTitle}</p><p className="mt-3 text-sm text-stone-600">{emptyText}</p></div></div>;
  return <div className={`grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4 ${className}`}>{products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} />)}</div>;
}
