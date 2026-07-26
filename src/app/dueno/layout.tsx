import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/session";
import { AppShell } from "@/components/app-shell";

export default async function DuenoLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  if (profile.role !== "dueno") redirect("/");

  return (
    <AppShell role="dueno" name={profile.full_name}>
      {children}
    </AppShell>
  );
}
