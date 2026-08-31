import { todayLocal } from "@/lib/date";

export type ExpiredSocio = {
  id: string;
  full_name: string | null;
  member_number: number | null;
  end_date: string;
};

/** Socios cuya membresía más reciente ya venció (excluye a quien nunca tuvo una). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cliente de Supabase tipado genéricamente
export async function getExpiredSocios(supabase: any): Promise<ExpiredSocio[]> {
  const today = todayLocal();

  const [{ data: socios }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, member_number").eq("role", "socio"),
    supabase
      .from("memberships")
      .select("socio_id, end_date")
      .order("end_date", { ascending: false }),
  ]);

  const latestBySocio = new Map<string, string>();
  for (const m of memberships ?? []) {
    if (!latestBySocio.has(m.socio_id)) latestBySocio.set(m.socio_id, m.end_date);
  }

  const expired: ExpiredSocio[] = [];
  for (const s of socios ?? []) {
    const endDate = latestBySocio.get(s.id);
    if (endDate && endDate < today) {
      expired.push({ id: s.id, full_name: s.full_name, member_number: s.member_number, end_date: endDate });
    }
  }

  expired.sort((a, b) => a.end_date.localeCompare(b.end_date));
  return expired;
}
