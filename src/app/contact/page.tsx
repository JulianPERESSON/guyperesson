import type { Metadata } from "next";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: "Contact", description: "Contactez L’Inventaire au sujet d’un objet, d’une livraison ou d’une collection." };

export default function ContactPage() {
  return <div className="container-page py-10 sm:py-16"><Breadcrumb items={[{ label: "Contact" }]} /><div className="mt-10 grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20"><div><p className="eyebrow text-[#a35f3f]">Parlons de votre recherche</p><h1 className="mt-4 text-5xl sm:text-6xl">Nous sommes à votre écoute.</h1><p className="mt-5 max-w-lg leading-7 text-stone-600">Besoin d’une photo supplémentaire, d’un détail sur la provenance ou d’une estimation de livraison ? Écrivez-nous, nous répondons personnellement.</p><dl className="mt-10 space-y-6 text-sm"><ContactLine icon={Mail} label="E-mail" value="bonjour@linventaire.example" /><ContactLine icon={Phone} label="Téléphone" value="Sur rendez-vous" /><ContactLine icon={Clock3} label="Réponse" value="Sous un jour ouvré" /><ContactLine icon={MapPin} label="Atelier" value="Aix-en-Provence, France" /></dl><div className="mt-10 rounded-2xl bg-[#e9dfd0]/70 p-6"><p className="text-sm font-bold text-[#173f35]">Vous souhaitez proposer une collection ?</p><p className="mt-2 text-sm leading-6 text-stone-600">Joignez une description générale, quelques photographies et la localisation des objets. Nous vous indiquerons rapidement si votre ensemble correspond à notre ligne.</p></div></div><ContactForm /></div></div>;
}

function ContactLine({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) { return <div className="flex gap-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#173f35] text-white"><Icon size={17} /></span><div><dt className="font-semibold">{label}</dt><dd className="mt-0.5 text-stone-600">{value}</dd></div></div>; }
