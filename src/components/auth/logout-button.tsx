"use client";
import { LogOut } from "lucide-react";
export function LogoutButton(){return <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 hover:text-red-700" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});window.location.assign("/")}}><LogOut size={16}/>Se déconnecter</button>}
