import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Membership, MembershipPlan, Profile } from "@/lib/types";
import { MembershipDialog } from "./membership-dialog";
import { deleteSocio, deleteMembership } from "@/app/dueno/actions";

export default async function StaffSociosPage() {
  const { profile, supabase } = await requireProfile();
  const isDueno = profile.role === "dueno";

  const [{ data: socios }, { data: memberships }, { data: plans }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "socio").order("full_name").returns<Profile[]>(),
    supabase
      .from("memberships")
      .select("*, membership_plans(*)")
      .order("end_date", { ascending: false })
      .returns<Membership[]>(),
    supabase.from("membership_plans").select("*").returns<MembershipPlan[]>(),
  ]);

  const latestBySocio = new Map<string, Membership>();
  for (const m of memberships ?? []) {
    if (!latestBySocio.has(m.socio_id)) latestBySocio.set(m.socio_id, m);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Socios</h1>
        <p className="text-muted-foreground">Consulta y actualiza el vencimiento de membresías.</p>
      </div>

      <div className="grid gap-4">
        {(socios ?? []).map((socio) => {
          const membership = latestBySocio.get(socio.id) ?? null;
          const expired = membership ? membership.end_date < today : true;
          return (
            <Card key={socio.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{socio.full_name ?? "Sin nombre"}</CardTitle>
                  <p className="text-sm text-muted-foreground">{socio.phone}</p>
                </div>
                <Badge variant={expired ? "destructive" : "default"}>
                  {expired ? "Vencida" : "Activa"}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {membership
                    ? `Plan: ${membership.membership_plans?.name ?? "—"} · Vence: ${membership.end_date}`
                    : "Sin membresía registrada"}
                </div>
                <div className="flex gap-2">
                  <MembershipDialog
                    socioId={socio.id}
                    socioNombre={socio.full_name ?? "Socio"}
                    plans={plans ?? []}
                    currentPlanId={membership?.plan_id ?? null}
                    currentEndDate={membership?.end_date ?? null}
                  />
                  {isDueno && membership && (
                    <form action={deleteMembership}>
                      <input type="hidden" name="id" value={membership.id} />
                      <Button type="submit" size="sm" variant="destructive">
                        Quitar membresía
                      </Button>
                    </form>
                  )}
                  {isDueno && (
                    <form action={deleteSocio}>
                      <input type="hidden" name="id" value={socio.id} />
                      <Button type="submit" size="sm" variant="destructive">
                        Eliminar socio
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!socios || socios.length === 0) && (
          <p className="text-muted-foreground">Aún no hay socios registrados.</p>
        )}
      </div>
    </div>
  );
}
