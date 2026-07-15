"use client";

import { Check, Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useShop } from "@/components/providers/shop-provider";

export function ProductActions({ productId, disabled = false, compact = false }: { productId: string; disabled?: boolean; compact?: boolean }) {
  const { addToCart, toggleFavorite, isFavorite } = useShop();
  const [added, setAdded] = useState(false);
  const favorite = isFavorite(productId);
  const add = () => { addToCart(productId); setAdded(true); window.setTimeout(() => setAdded(false), 1800); };

  if (compact) return <div className="flex items-center gap-2"><button type="button" onClick={add} disabled={disabled} aria-label={added ? "Ajouté au panier" : "Ajouter au panier"} className="grid h-10 w-10 place-items-center rounded-full bg-[#173f35] text-white transition hover:bg-[#285f50] disabled:bg-stone-300">{added ? <Check size={17} /> : <ShoppingBag size={17} />}</button><button type="button" aria-pressed={favorite} onClick={() => toggleFavorite(productId)} aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"} className={`grid h-10 w-10 place-items-center rounded-full border transition ${favorite ? "border-[#a35f3f] bg-[#a35f3f] text-white" : "border-stone-300 bg-white/80 text-stone-700 hover:border-[#173f35]"}`}><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button></div>;

  return <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><button type="button" className="btn-primary w-full" onClick={add} disabled={disabled}>{added ? <><Check size={18} /> Ajouté au panier</> : <><ShoppingBag size={18} /> Ajouter au panier</>}</button><button type="button" className={`btn-secondary px-4 ${favorite ? "border-[#a35f3f] text-[#a35f3f]" : ""}`} onClick={() => toggleFavorite(productId)} aria-pressed={favorite}><Heart size={18} fill={favorite ? "currentColor" : "none"} /><span className="sm:sr-only">{favorite ? "Retirer des favoris" : "Ajouter aux favoris"}</span></button></div>;
}
