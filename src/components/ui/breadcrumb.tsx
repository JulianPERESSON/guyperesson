import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav aria-label="Fil d’Ariane"><ol className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500"><li><Link href="/" className="hover:text-[#173f35]">Accueil</Link></li>{items.map((item, index) => <li className="flex items-center gap-1.5" key={`${item.label}-${index}`}><ChevronRight size={12} aria-hidden="true" />{item.href ? <Link className="hover:text-[#173f35]" href={item.href}>{item.label}</Link> : <span aria-current="page" className="text-stone-800">{item.label}</span>}</li>)}</ol></nav>;
}
