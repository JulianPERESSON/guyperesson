import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: "Questions fréquentes", description: "Réponses sur l’état, les réservations, le paiement, la livraison et les retours." };

const faqs = [
  ["Les objets sont-ils authentiques ?", "Chaque pièce est examinée et documentée au mieux de nos connaissances. Les attributions incertaines et dates estimées sont toujours signalées clairement."],
  ["Pourquoi certains objets vendus restent-ils visibles ?", "Le catalogue sert aussi d’archive aux collectionneurs. Une mention « Vendu » très visible empêche toute confusion et la commande reste impossible."],
  ["Comment fonctionne une réservation ?", "Votre demande est étudiée par le vendeur. Après acceptation, l’objet est bloqué pendant la durée indiquée dans notre confirmation. Une demande seule ne vaut pas réservation."],
  ["Puis-je demander des photographies supplémentaires ?", "Oui. Utilisez le formulaire présent sur chaque fiche en précisant le détail ou l’angle qui vous intéresse."],
  ["Comment sont calculés les frais de livraison ?", "Ils dépendent du poids, des dimensions, de la fragilité et de la destination. Le montant final est affiché avant le paiement."],
  ["Expédiez-vous hors de France ?", "Oui pour la plupart des destinations. Les objets très fragiles ou volumineux peuvent faire l’objet d’un devis personnalisé."],
  ["Quels moyens de paiement acceptez-vous ?", "Les paiements par carte sont sécurisés par Stripe. PayPal pourra être proposé ultérieurement."],
  ["Puis-je retourner un objet ?", "Oui, dans le délai légal applicable aux ventes à distance, sous réserve que l’objet soit retourné dans son état et son emballage protecteur d’origine."],
];

export default function FaqPage() { return <><section className="border-b hairline bg-[#e9dfd0]/55"><div className="container-page py-12 sm:py-16"><Breadcrumb items={[{ label: "FAQ" }]} /><p className="eyebrow mt-10 text-[#a35f3f]">Besoin d’aide ?</p><h1 className="mt-4 text-5xl sm:text-6xl">Questions fréquentes</h1><p className="mt-5 max-w-2xl leading-7 text-stone-600">Tout ce qu’il faut savoir avant d’adopter un objet de la collection.</p></div></section><section className="container-page mx-auto max-w-4xl py-12 sm:py-20"><div className="divide-y hairline border-y hairline">{faqs.map(([question, answer], index) => <details className="group py-5" key={question} open={index === 0}><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-bold marker:hidden"><span>{question}</span><span className="text-2xl font-light text-[#a35f3f] group-open:rotate-45">+</span></summary><p className="max-w-2xl pt-4 text-sm leading-7 text-stone-600">{answer}</p></details>)}</div></section></>; }
