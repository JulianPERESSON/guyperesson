export const SITE_NAME = "L'Inventaire";
export const SITE_DESCRIPTION = "Objets de collection choisis et documentés avec soin.";

export const mainNavigation = [
  { label: "Céramique", href: "/ceramique" },
  { label: "Revues auto & moto", href: "/revues-auto-moto" },
  { label: "Cartes postales", href: "/cartes-postales" },
  { label: "Collections", href: "/collections" },
] as const;

export const utilityNavigation = [
  { label: "Nouveautés", href: "/nouveautes" },
  { label: "Objets rares", href: "/objets-rares" },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
] as const;

export const formatPrice = (priceInEuros: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(priceInEuros);
