import { Copy, Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/catalogue/status-badge";
import { formatPrice } from "@/lib/site";
import { listAdminProducts } from "@/lib/server/product-repository";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listAdminProducts();
  const available = products.filter(
    (product) => product.status === "AVAILABLE",
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[#a35f3f]">Catalogue</p>
          <h1 className="mt-3 text-4xl">Produits</h1>
          <p className="mt-2 text-sm text-stone-500">
            {products.length} objets · {available} disponibles
          </p>
        </div>
        <Link className="btn-primary" href="/admin/produits/nouveau">
          <Plus size={16} />
          Ajouter un produit
        </Link>
      </div>

      <div className="surface mt-7 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b hairline p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              size={15}
            />
            <input
              className="field min-h-9 w-64 py-1.5 pl-9 text-xs"
              placeholder="Nom, référence, collection…"
              aria-label="Recherche rapide dans les produits"
            />
          </div>
          <select
            className="field min-h-9 w-40 py-1.5 text-xs"
            aria-label="Filtrer les produits par statut"
          >
            <option>Tous les statuts</option>
            <option>Disponible</option>
            <option>Réservé</option>
            <option>Vendu</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-xs">
            <thead className="bg-stone-100/70 text-stone-500">
              <tr>
                <th className="px-4 py-3">Objet</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Vues</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y hairline">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <strong className="block max-w-60 truncate">
                      {product.name}
                    </strong>
                    <span className="mt-1 block text-[10px] text-stone-400">
                      {product.reference}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {product.categoryName}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {Math.floor(34 + product.name.length * 7)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/produits/${product.slug}`}
                        className="rounded-full p-2 text-stone-500 hover:bg-white"
                        aria-label={`Voir ${product.name}`}
                      >
                        <Search size={14} />
                      </Link>
                      <button
                        className="rounded-full p-2 text-stone-500 hover:bg-white"
                        aria-label={`Dupliquer ${product.name}`}
                        type="button"
                      >
                        <Copy size={14} />
                      </button>
                      <Link
                        href={`/admin/produits/${product.slug}`}
                        className="rounded-full p-2 text-stone-500 hover:bg-white"
                        aria-label={`Modifier ${product.name}`}
                      >
                        <Pencil size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
