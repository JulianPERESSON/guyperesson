"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function NewsletterForm() {
  const [sent, setSent] = useState(false);
  if (sent) return <p className="flex items-center gap-2 text-sm font-semibold text-white"><Check size={18} /> Votre inscription est enregistrée. Merci.</p>;
  return <form className="flex w-full max-w-md flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><label className="sr-only" htmlFor="newsletter-email">Adresse e-mail</label><input className="field min-w-0 flex-1 border-white/20 bg-white/10 text-white placeholder:text-white/55" id="newsletter-email" name="email" type="email" required placeholder="Votre adresse e-mail" /><button className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#e7d6bc] px-5 text-sm font-bold text-[#173f35] hover:bg-white" type="submit">S’inscrire <ArrowRight size={16} /></button></form>;
}
