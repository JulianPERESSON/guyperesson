"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole, PackageOpen, ShoppingBag, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useShop } from "@/components/providers/shop-provider";
import { DemoArtwork } from "@/components/ui/demo-artwork";
import { products } from "@/data/products";
import { formatPrice } from "@/lib/site";
import type { MainCategorySlug } from "@/types/catalog";

function kind(category: MainCategorySlug): "CERAMIC"|"MAGAZINE"|"POSTCARD" { return category === "ceramique" ? "CERAMIC" : category === "revues-auto-moto" ? "MAGAZINE" : "POSTCARD"; }

export function CartPageClient() {
  const { cart, removeFromCart } = useShop();
  const [promotion, setPromotion] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [promoError, setPromoError] = useState(false);
  const lines = useMemo(() => cart.flatMap((line) => { const product = products.find((item) => item.id === line.productId); return product ? [{ ...line, product }] : []; }), [cart]);
  const subtotal = lines.reduce((sum,line)=>sum+line.product.price*line.quantity,0);
  const shipping = lines.length ? Math.max(...lines.map((line)=>line.product.shippingPrice)) : 0;
  const discount = appliedCode === "INVENTAIRE10" ? Math.round(subtotal*.1*100)/100 : 0;
  const total = subtotal + shipping - discount;

  if (!lines.length) return <section className="container-page grid min-h-[65vh] place-items-center py-20 text-center"><div><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#e9dfd0]"><PackageOpen size={32} className="text-[#173f35]"/></span><h1 className="mt-6 text-5xl">Votre panier est vide</h1><p className="mx-auto mt-4 max-w-md leading-7 text-stone-600">Il attend peut-être une céramique singulière, un numéro rare ou une carte venue d’ailleurs.</p><Link href="/catalogue" className="btn-primary mt-8"><ShoppingBag size={17}/>Explorer le catalogue</Link></div></section>;

  return <section className="container-page py-10 sm:py-16"><div className="flex items-end justify-between border-b hairline pb-7"><div><p className="eyebrow text-[#a35f3f]">Votre sélection</p><h1 className="mt-4 text-5xl sm:text-6xl">Panier</h1></div><p className="text-sm text-stone-500">{lines.length} objet{lines.length>1?"s":""}</p></div><div className="mt-9 grid items-start gap-10 lg:grid-cols-[1fr_23rem]"><div className="divide-y hairline border-y hairline">{lines.map(({product,quantity})=><article key={product.id} className="grid grid-cols-[6.5rem_1fr_auto] gap-4 py-5 sm:grid-cols-[9rem_1fr_auto]"><Link href={`/produits/${product.slug}`}><DemoArtwork kind={kind(product.categorySlug)} title={product.name} className="aspect-square rounded-xl"/></Link><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-stone-500">{product.reference}</p><h2 className="mt-2 text-lg leading-tight sm:text-2xl"><Link href={`/produits/${product.slug}`} className="hover:text-[#173f35]">{product.name}</Link></h2><p className="mt-2 hidden text-xs text-stone-500 sm:block">{product.condition.replaceAll("_"," ")} · Pièce unique</p><p className="mt-4 text-sm font-bold text-[#173f35]">{formatPrice(product.price)}</p></div><div className="flex flex-col items-end justify-between"><button onClick={()=>removeFromCart(product.id)} aria-label={`Retirer ${product.name}`} className="rounded-full p-2 text-stone-400 hover:bg-red-50 hover:text-red-700"><Trash2 size={17}/></button><span className="rounded-full border hairline px-3 py-1.5 text-xs">Qté {quantity}</span></div></article>)}</div><aside className="surface sticky top-32 p-6"><h2 className="font-sans text-base font-bold">Récapitulatif</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-stone-600">Sous-total</dt><dd>{formatPrice(subtotal)}</dd></div><div className="flex justify-between"><dt className="text-stone-600">Livraison suivie</dt><dd>{formatPrice(shipping)}</dd></div>{discount>0&&<div className="flex justify-between text-emerald-800"><dt>Remise {appliedCode}</dt><dd>− {formatPrice(discount)}</dd></div>}<div className="flex justify-between border-t hairline pt-4 text-base font-bold"><dt>Total</dt><dd>{formatPrice(total)}</dd></div></dl><div className="mt-6"><label className="mb-2 block text-xs font-bold" htmlFor="promo">Code promotionnel</label><form className="flex gap-2" onSubmit={(event)=>{event.preventDefault();const valid=promotion.trim().toUpperCase()==="INVENTAIRE10";setPromoError(!valid);setAppliedCode(valid?"INVENTAIRE10":null)}}><input id="promo" className="field min-w-0 text-sm uppercase" value={promotion} onChange={(e)=>setPromotion(e.target.value)} placeholder="Votre code"/><button className="btn-secondary px-3" type="submit">OK</button></form>{promoError&&<p role="alert" className="mt-2 flex items-center gap-1 text-xs text-red-700"><X size={12}/>Ce code n’est pas valide.</p>}</div><Link href="/commande" className="btn-primary mt-6 w-full">Passer la commande <ArrowRight size={17}/></Link><p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-stone-500"><LockKeyhole size={13}/>Paiement sécurisé par Stripe</p></aside></div></section>;
}
