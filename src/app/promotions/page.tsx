import type { Metadata } from "next";
import { CuratedListing } from "@/components/catalogue/curated-listing";
import { products } from "@/data/products";
export const metadata: Metadata = { title: "Promotions" };
export default function Page(){return <CuratedListing eyebrow="Prix ajustés" title="Promotions" intro="Une sélection temporaire d’objets proposés à prix doux, sans compromis sur la documentation." products={products.filter((p)=>p.previousPrice && p.published)}/>;}
