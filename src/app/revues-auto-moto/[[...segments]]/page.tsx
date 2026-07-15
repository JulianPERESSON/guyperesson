import type { Metadata } from "next";
import { CategoryRoutePage } from "@/components/catalogue/category-route-page";
export const metadata: Metadata = { title: "Revues auto et moto", description: "Revues, essais, programmes et hors-séries automobiles et motos classés par titre, marque et date." };
export default function Page(props: { params: Promise<{segments?:string[]}>; searchParams: Promise<Record<string,string|string[]|undefined>> }) { return <CategoryRoutePage slug="revues-auto-moto" {...props}/>; }
