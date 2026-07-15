"use client";

import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  if (state === "sent") return <div className="surface p-8 text-center"><CheckCircle2 className="mx-auto text-emerald-700" size={36} /><h2 className="mt-4 text-2xl">Votre message est parti</h2><p className="mt-2 text-sm text-stone-600">Nous revenons vers vous sous un jour ouvré.</p></div>;
  return <form className="surface grid gap-5 p-6 sm:p-8" onSubmit={async (event) => { event.preventDefault(); setState("sending"); const payload = Object.fromEntries(new FormData(event.currentTarget)); try { const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (!response.ok) throw new Error(); setState("sent"); } catch { setState("error"); } }}>
    <div className="grid gap-4 sm:grid-cols-2"><ContactField id="contact-name" name="name" label="Nom complet" required /><ContactField id="contact-email" name="email" type="email" label="Adresse e-mail" required /></div>
    <ContactField id="contact-phone" name="phone" type="tel" label="Téléphone (facultatif)" />
    <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="contact-subject">Objet</label><select className="field" id="contact-subject" name="subject"><option>Question sur un objet</option><option>Livraison et retours</option><option>Proposer une collection</option><option>Autre demande</option></select></div>
    <div><label className="mb-1.5 block text-sm font-semibold" htmlFor="contact-message">Votre message</label><textarea className="field min-h-36 resize-y" id="contact-message" name="message" required minLength={10} /></div>
    {state === "error" && <p role="alert" className="text-sm font-semibold text-red-700">Impossible d’envoyer le message pour le moment.</p>}
    <button className="btn-primary justify-self-start" disabled={state === "sending"}>{state === "sending" ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={17} />}Envoyer le message</button>
  </form>;
}

function ContactField({ id, name, label, type = "text", required = false }: { id: string; name: string; label: string; type?: string; required?: boolean }) { return <div><label className="mb-1.5 block text-sm font-semibold" htmlFor={id}>{label}</label><input className="field" id={id} name={name} type={type} required={required} /></div>; }
