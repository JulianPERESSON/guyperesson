"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useShop } from "@/components/providers/shop-provider";
import { mainNavigation, SITE_NAME, utilityNavigation } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount, favorites } = useShop();

  return (
    <header className="sticky top-0 z-50 border-b hairline bg-[#f7f3eb]/95 backdrop-blur-xl">
      <div className="border-b hairline bg-[#173f35] text-white">
        <div className="container-page flex min-h-8 items-center justify-between gap-4 text-[11px] tracking-wide">
          <p>Livraison soignée depuis la France</p>
          <nav aria-label="Navigation secondaire" className="hidden items-center gap-5 sm:flex">
            <Link href="/nouveautes" className="hover:underline">Nouveautés</Link>
            <Link href="/faq" className="hover:underline">FAQ</Link>
            <Link href="/contact" className="hover:underline">Nous contacter</Link>
          </nav>
        </div>
      </div>
      <div className="container-page flex h-[4.8rem] items-center justify-between gap-4">
        <button className="-ml-2 rounded-full p-2 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <Link href="/" className="group shrink-0" aria-label="L'Inventaire, accueil">
          <span className="font-display block text-[1.65rem] leading-none text-[#173f35]">{SITE_NAME}</span>
          <span className="mt-1 hidden text-[8px] font-bold uppercase tracking-[.3em] text-stone-500 sm:block">Objets choisis · Depuis 1987</span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-7 lg:flex">
          {mainNavigation.map((item) => (
            <Link key={item.href} href={item.href} className={`relative py-3 text-[13px] font-semibold transition-colors hover:text-[#173f35] ${pathname.startsWith(item.href) ? "text-[#173f35]" : "text-stone-600"}`}>
              {item.label}
              {pathname.startsWith(item.href) && <span className="absolute inset-x-0 bottom-1 mx-auto h-px w-5 bg-[#173f35]" />}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Link href="/catalogue" aria-label="Rechercher" className="rounded-full p-2.5 hover:bg-white"><Search size={20} /></Link>
          <Link href="/compte/favoris" aria-label={`Favoris, ${favorites.length} objet`} className="relative hidden rounded-full p-2.5 hover:bg-white sm:flex"><Heart size={20} />{favorites.length > 0 && <Counter value={favorites.length} />}</Link>
          <Link href="/connexion" aria-label="Mon compte" className="hidden rounded-full p-2.5 hover:bg-white sm:flex"><UserRound size={20} /></Link>
          <Link href="/panier" aria-label={`Panier, ${cartCount} article`} className="relative rounded-full p-2.5 hover:bg-white"><ShoppingBag size={20} />{cartCount > 0 && <Counter value={cartCount} />}</Link>
        </div>
      </div>
      {open && (
        <nav aria-label="Menu mobile" className="border-t hairline bg-[#f7f3eb] px-4 py-6 lg:hidden">
          <div className="container-page grid gap-1">
            {[...mainNavigation, ...utilityNavigation].map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-white">{item.label}</Link>)}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t hairline pt-4">
              <Link className="btn-secondary" href="/connexion"><UserRound size={17} /> Mon compte</Link>
              <Link className="btn-secondary" href="/compte/favoris"><Heart size={17} /> Mes favoris</Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

function Counter({ value }: { value: number }) {
  return <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#a35f3f] px-1 text-[9px] font-bold text-white">{value}</span>;
}
