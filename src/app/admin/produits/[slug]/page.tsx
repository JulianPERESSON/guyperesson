import { ProductForm } from "@/components/admin/product-form";
import { getProductBySlug } from "@/data/products";
import { notFound } from "next/navigation";
export default async function EditProductPage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const product=getProductBySlug(slug);if(!product)notFound();return <div><p className="eyebrow text-[#a35f3f]">{product.reference}</p><h1 className="mt-3 text-4xl">Modifier l’objet</h1><p className="mt-3 mb-7 text-sm text-stone-500">{product.name}</p><ProductForm/></div>}
