import type { Metadata } from "next";
import { CategoryRoutePage } from "@/components/catalogue/category-route-page";
export const metadata: Metadata = { title: "Cartes postales anciennes", description: "Cartes postales classées par territoire, thème, éditeur et période." };
export default function Page(props: { params: Promise<{segments?:string[]}>; searchParams: Promise<Record<string,string|string[]|undefined>> }) { return <CategoryRoutePage slug="cartes-postales" {...props}/>; }
