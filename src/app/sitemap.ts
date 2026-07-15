import type { MetadataRoute } from "next";
import { collections } from "@/data/collections";
import { products } from "@/data/products";
const base=process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000";
export default function sitemap():MetadataRoute.Sitemap{const staticPaths=["","/catalogue","/ceramique","/revues-auto-moto","/cartes-postales","/collections","/nouveautes","/objets-rares","/promotions","/a-propos","/contact","/faq","/mentions-legales","/cgv","/confidentialite","/cookies","/livraison-retours"];const now=new Date();return [...staticPaths.map((path)=>({url:`${base}${path}`,lastModified:now,changeFrequency:path===""?"daily" as const:"weekly" as const,priority:path===""?1:.7})),...products.filter(p=>p.published).map(p=>({url:`${base}/produits/${p.slug}`,lastModified:new Date(p.updatedAt),changeFrequency:"weekly" as const,priority:.8})),...collections.map(c=>({url:`${base}/collections/${c.slug}`,lastModified:now,changeFrequency:"monthly" as const,priority:.7}))]}
