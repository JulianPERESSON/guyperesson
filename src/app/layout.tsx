import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ShopProvider } from "@/components/providers/shop-provider";
import { CookieNotice } from "@/components/ui/cookie-notice";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "L'Inventaire — Objets de collection choisis",
    template: "%s | L'Inventaire",
  },
  description:
    "Céramiques, revues automobiles et motos, cartes postales : une sélection documentée d'objets de collection.",
  applicationName: "L'Inventaire",
  keywords: ["objets de collection", "céramique", "revues automobiles", "cartes postales anciennes"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "L'Inventaire",
    title: "L'Inventaire — Objets de collection choisis",
    description: "Des objets singuliers, documentés avec soin et expédiés avec attention.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full scroll-smooth" suppressHydrationWarning>
      <body className="min-h-full bg-stone-50 text-stone-900 antialiased">
        <ShopProvider>
          <a className="skip-link" href="#contenu">Aller au contenu</a>
          <SiteHeader />
          <main id="contenu" className="min-h-[60vh]">{children}</main>
          <SiteFooter />
          <CookieNotice />
        </ShopProvider>
      </body>
    </html>
  );
}
