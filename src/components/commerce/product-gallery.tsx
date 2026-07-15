"use client";

import { Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DemoArtwork } from "@/components/ui/demo-artwork";
import type { MainCategorySlug } from "@/types/catalog";

function kind(category: MainCategorySlug): "CERAMIC" | "MAGAZINE" | "POSTCARD" { return category === "ceramique" ? "CERAMIC" : category === "revues-auto-moto" ? "MAGAZINE" : "POSTCARD"; }

export function ProductGallery({ title, category }: { title: string; category: MainCategorySlug }) {
  const [zoom, setZoom] = useState(false);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setZoom(false); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  return <><div className="grid gap-3 sm:grid-cols-[1fr_7rem]"><button onClick={() => setZoom(true)} className="group relative overflow-hidden rounded-[1.5rem] text-left" aria-label="Agrandir le visuel"><DemoArtwork kind={kind(category)} title={title} className="aspect-[4/5] sm:aspect-[5/6]"/><span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-stone-800 shadow-sm backdrop-blur transition group-hover:scale-105"><Maximize2 size={17}/></span></button><div className="grid grid-cols-3 gap-3 sm:grid-cols-1 sm:self-start">{["Vue principale", "Détail", "Dos"].map((label,index) => <button key={label} onClick={() => setZoom(true)} aria-label={`Agrandir : ${label}`} className={`overflow-hidden rounded-xl border-2 ${index === 0 ? "border-[#173f35]" : "border-transparent opacity-70 hover:opacity-100"}`}><DemoArtwork kind={kind(category)} title={`${title}, ${label}`} priorityLabel={label} className="aspect-square"/></button>)}</div></div>{zoom && <div className="fixed inset-0 z-[90] grid place-items-center bg-[#111814]/95 p-4" role="dialog" aria-modal="true" aria-label={`Vue agrandie de ${title}`} onClick={() => setZoom(false)}><button className="absolute right-5 top-5 rounded-full bg-white p-3 text-stone-900" onClick={() => setZoom(false)} aria-label="Fermer la vue agrandie"><X/></button><div className="h-[min(88vh,62rem)] max-w-[90vw] overflow-hidden rounded-2xl" onClick={(event) => event.stopPropagation()}><DemoArtwork kind={kind(category)} title={title} className="h-full aspect-[4/5]"/></div></div>}</>;
}
