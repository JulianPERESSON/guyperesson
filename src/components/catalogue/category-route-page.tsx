import { notFound } from "next/navigation";
import { CategoryLanding } from "@/components/catalogue/category-landing";
import { categoryBySlug } from "@/data/categories";
import { products } from "@/data/products";
import type { MainCategorySlug } from "@/types/catalog";

type Search = Record<string, string | string[] | undefined>;

export async function CategoryRoutePage({ slug, params, searchParams }: { slug: MainCategorySlug; params: Promise<{ segments?: string[] }>; searchParams: Promise<Search> }) {
  const category = categoryBySlug.get(slug);
  if (!category) notFound();
  const [{ segments = [] }, query] = await Promise.all([params, searchParams]);
  const scoped = products.filter((product) => product.categorySlug === slug && segments.every((segment) => {
    const candidates = [product.subcategorySlug, slugify(product.period), slugify(product.country), slugify(product.region ?? ""), slugify(product.city ?? "")];
    return candidates.includes(segment) || product.keywords.some((keyword) => slugify(keyword) === segment);
  }));
  return <CategoryLanding category={category} products={segments.length ? scoped : products} initial={toInitial(query)} />;
}

function toInitial(search: Search): Record<string, string | undefined> { return Object.fromEntries(Object.entries(search).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])); }
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
