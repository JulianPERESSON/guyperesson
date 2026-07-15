import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { getSession } from "@/lib/server/session";
export default async function AccountLayout({children}:{children:React.ReactNode}){const session=await getSession();if(!session)redirect("/connexion?callbackUrl=/compte");return <section className="container-page py-10 sm:py-14"><div className="mb-9"><p className="eyebrow text-[#a35f3f]">Espace client</p><h1 className="mt-3 text-4xl sm:text-5xl">Bonjour, {session.name}</h1><p className="mt-2 text-sm text-stone-500">{session.email}</p></div><div className="grid items-start gap-8 lg:grid-cols-[14rem_1fr]"><AccountNav/><div className="min-w-0">{children}</div></div></section>}
