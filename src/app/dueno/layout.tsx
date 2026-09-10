import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/session";
import { AppShell } from "@/components/app-shell";

export default async function DuenoLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await requireProfile();
  if (profile.role !== "dueno") redirect("/");

  const { count: comprobantesPendientes } = await supabase
    .from("payment_proofs")
    .select("*", { count: "exact", head: true })
    .eq("status", "pendiente");

  return (
    <AppShell
      role="dueno"
      name={profile.full_name}
      badges={{ "/staff/comprobantes": comprobantesPendientes ?? 0 }}
    >
      {children}
    </AppShell>
  );
}
