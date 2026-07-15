import Link from "next/link";
import { Camera, Mail, MapPin } from "lucide-react";
import { mainNavigation, SITE_NAME } from "@/lib/site";

const helpLinks = [
  ["FAQ", "/faq"], ["Livraison & retours", "/livraison-retours"], ["Contact", "/contact"], ["Suivre ma commande", "/compte/commandes"],
] as const;
const legalLinks = [
  ["Mentions légales", "/mentions-legales"], ["Conditions de vente", "/cgv"], ["Confidentialité", "/confidentialite"], ["Cookies", "/cookies"],
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-[#18221e] text-stone-200">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="font-display text-3xl text-white">{SITE_NAME}</p>
          <p className="mt-4 text-sm leading-6 text-stone-400">Une collection vivante de céramiques, d’archives mécaniques et de cartes postales, choisie pièce après pièce.</p>
          <div className="mt-6 flex gap-2">
            <a href="mailto:bonjour@example.fr" aria-label="Nous écrire" className="rounded-full border border-white/15 p-2.5 hover:bg-white/10"><Mail size={18} /></a>
            <a href="#" aria-label="Galerie sociale" className="rounded-full border border-white/15 p-2.5 hover:bg-white/10"><Camera size={18} /></a>
          </div>
        </div>
        <FooterColumn title="Explorer" links={mainNavigation.map(({ label, href }) => [label, href] as const)} />
        <FooterColumn title="Vous aider" links={helpLinks} />
        <FooterColumn title="Informations" links={legalLinks} />
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE_NAME}. Démonstration e-commerce.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/admin" className="transition hover:text-stone-200">Administration</Link>
            <p className="flex items-center gap-1.5"><MapPin size={13} /> Expéditions depuis Aix-en-Provence</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return <div><h2 className="font-sans text-xs font-bold uppercase tracking-[.16em] text-white">{title}</h2><ul className="mt-5 space-y-3 text-sm text-stone-400">{links.map(([label, href]) => <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>)}</ul></div>;
}
