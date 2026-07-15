import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-form";
export const metadata:Metadata={title:"Mot de passe oublié",robots:{index:false,follow:false}};
export default function ForgotPage(){return <AuthShell eyebrow="Accès au compte" title="Mot de passe oublié" intro="Indiquez l’adresse utilisée lors de votre inscription." footer={<Link className="font-bold text-[#173f35] hover:underline" href="/connexion">Retour à la connexion</Link>}><ForgotPasswordForm/></AuthShell>}
