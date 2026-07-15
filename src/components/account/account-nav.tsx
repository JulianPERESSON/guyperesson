import Link from "next/link";
import { Heart, House, MapPin, PackageCheck, UserRoundCheck } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
const links=[[House,"Vue d’ensemble","/compte"],[PackageCheck,"Mes commandes","/compte/commandes"],[Heart,"Mes favoris","/compte/favoris"],[UserRoundCheck,"Mes réservations","/compte/reservations"],[MapPin,"Mes adresses","/compte/adresses"]] as const;
export function AccountNav(){return <nav aria-label="Espace client" className="surface p-3"><p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[.14em] text-stone-400">Mon espace</p>{links.map(([Icon,label,href])=><Link key={href} href={href} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-[#173f35]"><Icon size={16}/>{label}</Link>)}<div className="mt-2 border-t hairline pt-2"><LogoutButton/></div></nav>}
