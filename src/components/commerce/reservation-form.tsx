"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";

export function ReservationForm({ productId, reference, mode = "reservation" }: { productId: string; reference: string; mode?: "reservation" | "information" }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  if (state === "sent") return <div className="rounded-xl border border-emerald-800/15 bg-emerald-50 p-5 text-emerald-900"><CheckCircle2 className="mb-3" /><p className="font-semibold">Demande bien reçue</p><p className="mt-1 text-sm">Nous vous répondrons sous un jour ouvré. L’objet n’est bloqué qu’après confirmation du vendeur.</p></div>;
  return <form className="grid gap-4" onSubmit={async (event) => { event.preventDefault(); setState("sending"); const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries()); try { const response = await fetch(mode === "reservation" ? "/api/reservations" : "/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, productId, reference }) }); if (!response.ok) throw new Error(); setState("sent"); } catch { setState("error"); } }}>
    <input type="hidden" name="subject" value={`${mode === "reservation" ? "Réservation" : "Information"} — ${reference}`} />
    <div className="grid gap-4 sm:grid-cols-2"><Field id={`${mode}-firstName`} name="firstName" label="Prénom" required /><Field id={`${mode}-lastName`} name="lastName" label="Nom" required /></div>
    <Field id={`${mode}-email`} name="email" type="email" label="Adresse e-mail" required />
    <Field id={`${mode}-phone`} name="phone" type="tel" label="Téléphone (facultatif)" />
    <div><label className="mb-1.5 block text-sm font-semibold" htmlFor={`${mode}-message`}>Votre message</label><textarea className="field min-h-28 resize-y" id={`${mode}-message`} name="message" minLength={10} required placeholder={mode === "reservation" ? "Je souhaite réserver cet objet…" : "Votre question sur cet objet…"} /></div>
    {state === "error" && <p role="alert" className="text-sm font-semibold text-red-700">La demande n’a pas pu être envoyée. Réessayez dans un instant.</p>}
    <button className="btn-primary" disabled={state === "sending"}>{state === "sending" && <LoaderCircle className="animate-spin" size={17} />}{mode === "reservation" ? "Demander la réservation" : "Envoyer ma demande"}</button>
  </form>;
}

function Field({ id, name, label, type = "text", required = false }: { id: string; name: string; label: string; type?: string; required?: boolean }) {
  return <div><label className="mb-1.5 block text-sm font-semibold" htmlFor={id}>{label}</label><input className="field" id={id} name={name} type={type} required={required} /></div>;
}
