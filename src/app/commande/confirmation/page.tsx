import type { Metadata } from "next";
import { OrderConfirmationClient } from "@/components/commerce/order-confirmation-client";
export const metadata:Metadata={title:"Commande confirmée",robots:{index:false,follow:false}};
export default async function ConfirmationPage({searchParams}:{searchParams:Promise<{session_id?:string;mode?:string}>}){const{session_id="confirmation",mode}=await searchParams;return <OrderConfirmationClient sessionId={session_id} mode={mode}/>}
