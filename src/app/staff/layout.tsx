import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/session";
import { AppShell } from "@/components/app-shell";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  if (profile.role !== "staff" && profile.role !== "dueno") redirect("/");

  return (
    <AppShell role="staff" name={profile.full_name}>
      {children}
    </AppShell>
  );
}
