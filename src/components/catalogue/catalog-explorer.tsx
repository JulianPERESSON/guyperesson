"use client";

import { Grid2X2, List, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CatalogProduct, MainCategorySlug, ProductStatus } from "@/types/catalog";
import { ProductCardList } from "./product-card";
import { ProductGrid } from "./product-grid";

type InitialFilters = { q?: string; category?: string; period?: string; status?: string; sort?: string; minPrice?: string; maxPrice?: string };
const statusLabels: Record<ProductStatus, string> = { AVAILABLE: "Disponible", RESERVED: "Réservé", SOLD: "Vendu", UNAVAILABLE: "Indisponible", COMING_SOON: "Bientôt disponible" };
const categoryLabels: Record<MainCategorySlug, string> = { ceramique: "Céramique", "revues-auto-moto": "Revues auto & moto", "cartes-postales": "Cartes postales" };

export function CatalogExplorer({ products, scopeCategory, initial = {} }: { products: readonly CatalogProduct[]; scopeCategory?: MainCategorySlug; initial?: InitialFilters }) {
  const [q, setQ] = useState(initial.q ?? "");
  const [category, setCategory] = useState(scopeCategory ?? initial.category ?? "ALL");
  const [period, setPeriod] = useState(initial.period ?? "ALL");
  const [status, setStatus] = useState(initial.status ?? "ALL");
  const [condition, setCondition] = useState("ALL");
  const [minPrice, setMinPrice] = useState(initial.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice ?? "");
  const [sort, setSort] = useState(initial.sort ?? "relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [visible, setVisible] = useState(12);

  const periods = useMemo(() => [...new Set(products.filter((p) => !scopeCategory || p.categorySlug === scopeCategory).map((p) => p.period))].sort(), [products, scopeCategory]);
  const conditions = useMemo(() => [...new Set(products.map((p) => p.condition))], [products]);
  const categoryOptions = useMemo(() => [...new Set(products.map((p) => p.categorySlug))], [products]);

  const filtered = useMemo(() => {
    const needle = normalize(q);
    const result = products.filter((product) => {
      const haystack = normalize([product.name, product.reference, product.description, product.categoryName, product.subcategory, product.period, product.country, product.region, product.city, product.manufacturer, product.artist, product.publisher, product.brand, product.model, ...product.keywords].filter(Boolean).join(" "));
      return (!scopeCategory || product.categorySlug === scopeCategory)
        && (category === "ALL" || product.categorySlug === category)
        && (period === "ALL" || product.period === period)
        && (status === "ALL" || product.status === status)
        && (condition === "ALL" || product.condition === condition)
        && (!needle || haystack.includes(needle))
        && (!minPrice || product.price >= Number(minPrice))
        && (!maxPrice || product.price <= Number(maxPrice));
    });
    return result.toSorted((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "oldest") return (a.estimatedYear ?? 9999) - (b.estimatedYear ?? 9999);
      if (sort === "newest-date") return (b.estimatedYear ?? 0) - (a.estimatedYear ?? 0);
      if (sort === "new") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      if (sort === "alphabetical") return a.name.localeCompare(b.name, "fr");
      if (sort === "rarity") return rarityScore(b.rarity) - rarityScore(a.rarity);
      return Number(b.featured) - Number(a.featured) || Number(b.status === "AVAILABLE") - Number(a.status === "AVAILABLE");
    });
  }, [products, q, category, scopeCategory, period, status, condition, minPrice, maxPrice, sort]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (!scopeCategory && category !== "ALL") params.set("category", category);
    if (period !== "ALL") params.set("period", period);
    if (status !== "ALL") params.set("status", status);
    if (sort !== "relevance") params.set("sort", sort);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    const next = `${window.location.pathname}${params.size ? `?${params}` : ""}`;
    window.history.replaceState(null, "", next);
  }, [q, category, scopeCategory, period, status, sort, minPrice, maxPrice]);

  const reset = () => { setQ(""); if (!scopeCategory) setCategory("ALL"); setPeriod("ALL"); setStatus("ALL"); setCondition("ALL"); setMinPrice(""); setMaxPrice(""); setSort("relevance"); };
  const activeCount = Number(Boolean(q)) + Number(!scopeCategory && category !== "ALL") + Number(period !== "ALL") + Number(status !== "ALL") + Number(condition !== "ALL") + Number(Boolean(minPrice)) + Number(Boolean(maxPrice));

  return <div>
    <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full max-w-2xl"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={19}/><label className="sr-only" htmlFor="catalog-search">Rechercher</label><input id="catalog-search" className="field h-12 rounded-full bg-white pl-11" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Rechercher un objet, une ville, une marque…" /></div>
      <div className="flex items-center justify-between gap-2"><button type="button" className="btn-secondary lg:hidden" onClick={() => setFilterOpen(true)}><SlidersHorizontal size={17}/>Filtres{activeCount > 0 && <span className="rounded-full bg-[#173f35] px-1.5 py-0.5 text-[10px] text-white">{activeCount}</span>}</button><label className="sr-only" htmlFor="sort">Trier les résultats</label><select id="sort" className="field min-w-48 rounded-full bg-white text-sm" value={sort} onChange={(event) => setSort(event.target.value)}><option value="relevance">Pertinence</option><option value="new">Nouveautés</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option><option value="oldest">Date la plus ancienne</option><option value="newest-date">Date la plus récente</option><option value="alphabetical">Ordre alphabétique</option><option value="rarity">Rareté</option></select><div className="hidden rounded-full border hairline bg-white p-1 sm:flex"><button className={`rounded-full p-2 ${view === "grid" ? "bg-[#173f35] text-white" : "text-stone-500"}`} onClick={() => setView("grid")} aria-label="Vue en grille" aria-pressed={view === "grid"}><Grid2X2 size={15}/></button><button className={`rounded-full p-2 ${view === "list" ? "bg-[#173f35] text-white" : "text-stone-500"}`} onClick={() => setView("list")} aria-label="Vue en liste" aria-pressed={view === "list"}><List size={15}/></button></div></div>
    </div>
    <div className="grid items-start gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-32 hidden lg:block"><FilterPanel {...{ products, scopeCategory, category, setCategory, categoryOptions, period, setPeriod, periods, status, setStatus, condition, setCondition, conditions, minPrice, setMinPrice, maxPrice, setMaxPrice, reset, activeCount }} /></aside>
      <div><div className="mb-6 flex items-center justify-between border-b hairline pb-4"><p className="text-sm text-stone-600"><strong className="text-stone-900">{filtered.length}</strong> objet{filtered.length > 1 ? "s" : ""}</p>{activeCount > 0 && <button onClick={reset} className="text-xs font-bold text-[#a35f3f] hover:underline">Effacer les filtres</button>}</div>{view === "grid" ? <ProductGrid products={filtered.slice(0, visible)} /> : <div className="grid gap-4">{filtered.slice(0, visible).map((product) => <ProductCardList product={product} key={product.id}/>)}</div>}{visible < filtered.length && <div className="mt-12 text-center"><button className="btn-secondary" onClick={() => setVisible((value) => value + 12)}>Afficher plus d’objets <span className="text-stone-500">({filtered.length - visible})</span></button></div>}</div>
    </div>
    {filterOpen && <div className="fixed inset-0 z-[70] bg-black/30 lg:hidden" onClick={() => setFilterOpen(false)}><div className="absolute inset-y-0 left-0 w-[min(90%,22rem)] overflow-y-auto bg-[#f7f3eb] p-6 shadow-2xl" role="dialog" aria-modal="true" aria-label="Filtres" onClick={(event) => event.stopPropagation()}><div className="mb-7 flex items-center justify-between"><h2 className="font-display text-3xl">Filtres</h2><button className="rounded-full p-2 hover:bg-white" onClick={() => setFilterOpen(false)} aria-label="Fermer les filtres"><X/></button></div><FilterPanel {...{ products, scopeCategory, category, setCategory, categoryOptions, period, setPeriod, periods, status, setStatus, condition, setCondition, conditions, minPrice, setMinPrice, maxPrice, setMaxPrice, reset, activeCount }} /><button className="btn-primary mt-7 w-full" onClick={() => setFilterOpen(false)}>Voir {filtered.length} résultat{filtered.length > 1 ? "s" : ""}</button></div></div>}
  </div>;
}

type FilterProps = {
  products: readonly CatalogProduct[]; scopeCategory?: MainCategorySlug; category: string; setCategory: (value: string) => void; categoryOptions: MainCategorySlug[]; period: string; setPeriod: (value: string) => void; periods: string[]; status: string; setStatus: (value: string) => void; condition: string; setCondition: (value: string) => void; conditions: CatalogProduct["condition"][]; minPrice: string; setMinPrice: (value: string) => void; maxPrice: string; setMaxPrice: (value: string) => void; reset: () => void; activeCount: number;
};
function FilterPanel({ scopeCategory, category, setCategory, categoryOptions, period, setPeriod, periods, status, setStatus, condition, setCondition, conditions, minPrice, setMinPrice, maxPrice, setMaxPrice, reset, activeCount }: FilterProps) {
  return <div className="space-y-7 text-sm">{!scopeCategory && <FilterSelect label="Catégorie" value={category} setValue={setCategory} options={categoryOptions.map((value) => ({ value, label: categoryLabels[value] }))}/>}<FilterSelect label="Période" value={period} setValue={setPeriod} options={periods.map((value) => ({ value, label: value }))}/><FilterSelect label="Disponibilité" value={status} setValue={setStatus} options={(Object.keys(statusLabels) as ProductStatus[]).map((value) => ({ value, label: statusLabels[value] }))}/><FilterSelect label="État" value={condition} setValue={setCondition} options={conditions.map((value) => ({ value, label: conditionLabel(value) }))}/><fieldset><legend className="mb-3 font-bold">Prix</legend><div className="grid grid-cols-2 gap-2"><label><span className="sr-only">Prix minimum</span><input className="field" type="number" min="0" inputMode="numeric" placeholder="Min. €" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}/></label><label><span className="sr-only">Prix maximum</span><input className="field" type="number" min="0" inputMode="numeric" placeholder="Max. €" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}/></label></div></fieldset>{activeCount > 0 && <button className="text-xs font-bold text-[#a35f3f] hover:underline" onClick={reset}>Réinitialiser tous les filtres</button>}</div>;
}
function FilterSelect({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="block"><span className="mb-2 block font-bold">{label}</span><select className="field bg-white" value={value} onChange={(event) => setValue(event.target.value)}><option value="ALL">Tous</option>{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>; }
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
function rarityScore(value: CatalogProduct["rarity"]) { return ["COMMON", "UNCOMMON", "RARE", "VERY_RARE", "EXCEPTIONAL"].indexOf(value); }
function conditionLabel(value: CatalogProduct["condition"]) { return ({ MINT: "État neuf", EXCELLENT: "Excellent", VERY_GOOD: "Très bon", GOOD: "Bon", FAIR: "Correct", POOR: "État d’usage" } as const)[value]; }
