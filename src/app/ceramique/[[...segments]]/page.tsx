import type { Metadata } from "next";
import { CategoryRoutePage } from "@/components/catalogue/category-route-page";
export const metadata: Metadata = { title: "Céramique de collection", description: "Faïences, porcelaines, grès et pièces signées classés par atelier, région et période." };
export default function Page(props: { params: Promise<{segments?:string[]}>; searchParams: Promise<Record<string,string|string[]|undefined>> }) { return <CategoryRoutePage slug="ceramique" {...props}/>; }
