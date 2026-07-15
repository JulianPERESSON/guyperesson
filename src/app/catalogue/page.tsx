import type { Metadata } from "next";

import { CatalogExplorer } from "@/components/catalogue/catalog-explorer";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { listPublishedProducts } from "@/lib/server/product-repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Recherchez et filtrez toutes les céramiques, revues auto et moto et cartes postales de L’Inventaire.",
};

type Search = Record<string, string | string[] | undefined>;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [query, products] = await Promise.all([
    searchParams,
    listPublishedProducts(),
  ]);
  const initial = Object.fromEntries(
    Object.entries(query).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );

  return (
    <>
      <section className="border-b hairline bg-[#e9dfd0]/45">
        <div className="container-page py-10 sm:py-14">
          <Breadcrumb items={[{ label: "Catalogue" }]} />
          <p className="eyebrow mt-9 text-[#a35f3f]">
            {products.length} objets documentés
          </p>
          <h1 className="mt-4 text-5xl sm:text-7xl">Le catalogue</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600">
            Croisez les époques, lieux, matières et états pour retrouver la
            pièce qui manque à votre collection.
          </p>
        </div>
      </section>
      <section className="container-page py-10 sm:py-14">
        <CatalogExplorer products={products} initial={initial} />
      </section>
    </>
  );
}
