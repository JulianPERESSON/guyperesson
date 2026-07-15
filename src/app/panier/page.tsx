import type { Metadata } from "next";
import { CartPageClient } from "@/components/commerce/cart-page-client";
export const metadata: Metadata = { title: "Panier", robots: { index: false, follow: false } };
export default function CartPage(){return <CartPageClient/>;}
