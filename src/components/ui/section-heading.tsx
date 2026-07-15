import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SectionHeading({ eyebrow, title, description, href, linkLabel = "Tout découvrir" }: { eyebrow?: string; title: string; description?: string; href?: string; linkLabel?: string }) {
  return <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl">{eyebrow && <p className="eyebrow mb-3 text-[#a35f3f]">{eyebrow}</p>}<h2 className="font-display text-balance text-3xl leading-tight text-[#20241f] sm:text-5xl">{title}</h2>{description && <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600 sm:text-base">{description}</p>}</div>{href && <Link href={href} className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#173f35] hover:underline">{linkLabel}<ArrowUpRight size={16} /></Link>}</div>;
}
