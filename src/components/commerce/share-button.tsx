"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  return <button className="btn-ghost min-h-10 px-3 text-xs" onClick={async () => { try { if (navigator.share) await navigator.share({ title, url: window.location.href }); else await navigator.clipboard.writeText(window.location.href); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* Partage annulé par le visiteur. */ } }}>{done ? <Check size={15}/> : <Share2 size={15}/>} {done ? "Lien copié" : "Partager"}</button>;
}
