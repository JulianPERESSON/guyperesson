import type { Metadata } from "next";
import { CuratedListing } from "@/components/catalogue/curated-listing";
import { products } from "@/data/products";
export const metadata: Metadata = { title: "Nouveautés" };
export default function Page(){return <CuratedListing eyebrow="Tout juste inventoriés" title="Nouveautés" intro="Les dernières pièces documentées et ajoutées à la boutique." products={products.filter((p)=>p.newArrival && p.published)}/>;}
