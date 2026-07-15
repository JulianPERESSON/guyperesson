import { Search, SlidersHorizontal } from "lucide-react";

export function SearchBar({ defaultValue = "", showFilterButton = false }: { defaultValue?: string; showFilterButton?: boolean }) {
  return <form action="/catalogue" className="flex w-full items-center gap-2"><label htmlFor="global-search" className="sr-only">Rechercher dans le catalogue</label><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={19} /><input id="global-search" name="q" defaultValue={defaultValue} className="field h-12 rounded-full bg-white pl-11 pr-4" placeholder="Un lieu, une époque, une manufacture…" /></div>{showFilterButton && <button className="btn-secondary lg:hidden" type="button" data-filter-toggle><SlidersHorizontal size={17} /><span className="hidden sm:inline">Filtrer</span></button>}<button type="submit" className="btn-primary hidden sm:inline-flex">Rechercher</button></form>;
}
