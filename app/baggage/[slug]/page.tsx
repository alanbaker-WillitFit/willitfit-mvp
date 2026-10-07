import { permanentRedirect } from "next/navigation";
export default async function LegacyBaggageAlias({params}:{params:Promise<{slug:string}>}){const {slug}=await params; permanentRedirect(`/airlines/${slug}/baggage`);}
