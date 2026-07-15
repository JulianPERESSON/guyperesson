import type { Metadata } from "next";
import { CuratedListing } from "@/components/catalogue/curated-listing";
import { products } from "@/data/products";
export const metadata: Metadata = { title: "Objets rares" };
export default function Page(){return <CuratedListing eyebrow="Peu courants à exceptionnels" title="Objets rares" intro="Une sélection de pièces singulières, recherchées pour leur édition, leur provenance ou leur rareté." products={products.filter((p)=>p.rareItem && p.published)}/>;}
