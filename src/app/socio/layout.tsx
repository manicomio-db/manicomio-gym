import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/session";
import { AppShell } from "@/components/app-shell";

export default async function SocioLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  if (profile.role !== "socio") redirect("/");

  return (
    <AppShell role="socio" name={profile.full_name}>
      {children}
    </AppShell>
  );
}
