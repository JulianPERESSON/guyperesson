import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-form";
export const metadata:Metadata={title:"Connexion",robots:{index:false,follow:false}};
export default function LoginPage(){return <AuthShell eyebrow="Bon retour parmi nous" title="Connexion" intro="Retrouvez vos commandes, favoris et réservations." footer={<>Pas encore de compte ? <Link className="font-bold text-[#173f35] hover:underline" href="/inscription">Créer un compte</Link></>}><Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-stone-100"/>}><LoginForm/></Suspense></AuthShell>}
