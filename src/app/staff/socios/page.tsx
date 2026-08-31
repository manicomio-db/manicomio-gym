import { requireProfile } from "@/lib/supabase/session";
import { todayLocal } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Membership, MembershipPlan, Profile } from "@/lib/types";
import { MembershipDialog } from "./membership-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { deleteSocio, deleteMembership } from "@/app/dueno/actions";

export default async function StaffSociosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { profile, supabase } = await requireProfile();
  const isDueno = profile.role === "dueno";
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status === "vencida" || params.status === "activa" ? params.status : "";

  let sociosQuery = supabase.from("profiles").select("*").eq("role", "socio").order("full_name");

  if (q) {
    const asNumber = Number(q);
    sociosQuery =
      !Number.isNaN(asNumber) && q !== ""
        ? sociosQuery.eq("member_number", asNumber)
        : sociosQuery.ilike("full_name", `%${q}%`);
  }

  const [{ data: socios }, { data: memberships }, { data: plans }] = await Promise.all([
    sociosQuery.returns<Profile[]>(),
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

  const today = todayLocal();

  const filteredSocios = (socios ?? []).filter((socio) => {
    if (!status) return true;
    const membership = latestBySocio.get(socio.id) ?? null;
    const expired = membership ? membership.end_date < today : true;
    return status === "vencida" ? expired : !expired;
  });

  function statusLink(s: string) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (s) p.set("status", s);
    const qs = p.toString();
    return `/staff/socios${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Socios</h1>
        <p className="text-muted-foreground">Consulta y actualiza el vencimiento de membresías.</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="q">Buscar por nombre o número de socio</Label>
          <Input id="q" name="q" defaultValue={q} placeholder="Ej: Rosita o 12" className="w-64" />
        </div>
        {status && <input type="hidden" name="status" value={status} />}
        <Button type="submit">Buscar</Button>
        {q && (
          <Button variant="ghost" render={<a href={statusLink(status)} />}>
            Limpiar búsqueda
          </Button>
        )}
      </form>

      <div className="flex gap-2">
        <Button size="sm" variant={!status ? "default" : "outline"} render={<a href={statusLink("")} />}>
          Todos
        </Button>
        <Button
          size="sm"
          variant={status === "vencida" ? "default" : "outline"}
          render={<a href={statusLink("vencida")} />}
        >
          Vencidas
        </Button>
        <Button
          size="sm"
          variant={status === "activa" ? "default" : "outline"}
          render={<a href={statusLink("activa")} />}
        >
          Activas
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredSocios.map((socio) => {
          const membership = latestBySocio.get(socio.id) ?? null;
          const expired = membership ? membership.end_date < today : true;
          return (
            <Card key={socio.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {socio.full_name ?? "Sin nombre"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      #{socio.member_number}
                    </span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {socio.username ? `@${socio.username}` : socio.phone}
                  </p>
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
                  <ResetPasswordDialog socioId={socio.id} socioNombre={socio.full_name ?? "Socio"} />
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
        {filteredSocios.length === 0 && (
          <p className="text-muted-foreground">
            {q || status
              ? "No se encontró ningún socio con esos filtros."
              : "Aún no hay socios registrados."}
          </p>
        )}
      </div>
    </div>
  );
}
