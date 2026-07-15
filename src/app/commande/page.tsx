import type { Metadata } from "next";
import { CheckoutPageClient } from "@/components/commerce/checkout-page-client";
export const metadata: Metadata={title:"Commande",robots:{index:false,follow:false}};
export default function CheckoutPage(){return <CheckoutPageClient/>}
