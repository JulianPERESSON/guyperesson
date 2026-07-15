"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductGrid } from "@/components/catalogue/product-grid";
import { useShop } from "@/components/providers/shop-provider";
import { products } from "@/data/products";
export function FavoritesClient(){const{favorites}=useShop();const items=products.filter((p)=>favorites.includes(p.id));if(!items.length)return <div className="surface p-10 text-center"><Heart className="mx-auto text-stone-300" size={36}/><h2 className="mt-4 text-3xl">Aucun favori pour le moment</h2><p className="mt-3 text-sm text-stone-600">Utilisez le cœur présent sur les fiches pour retrouver vos objets ici.</p><Link className="btn-primary mt-6" href="/catalogue">Explorer le catalogue</Link></div>;return <ProductGrid products={items} className="xl:grid-cols-3"/>}
