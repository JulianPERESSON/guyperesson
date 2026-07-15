import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-form";
export const metadata:Metadata={title:"Créer un compte",robots:{index:false,follow:false}};
export default function RegisterPage(){return <AuthShell eyebrow="Rejoindre L’Inventaire" title="Créer un compte" intro="Suivez vos commandes et conservez vos objets favoris." footer={<>Déjà inscrit ? <Link className="font-bold text-[#173f35] hover:underline" href="/connexion">Se connecter</Link></>}><RegisterForm/></AuthShell>}
