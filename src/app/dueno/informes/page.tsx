import Link from "next/link";
import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AGE_RANGES,
  ACTIVITY_LABEL,
  CONDITIONS,
  SEX_LABEL,
  ageFromBirthDate,
  assessRisk,
  bmi,
  bmiCategory,
  RISK_LABEL,
} from "@/lib/health";
import type { HealthProfile } from "@/lib/types";

type SocioRow = { id: string; full_name: string | null; member_number: number | null };

function Bars({ rows, total }: { rows: { label: string; count: number }[]; total: number }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[9rem_1fr_5rem] items-center gap-3 text-sm">
          <span className="truncate">{r.label}</span>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
          <span className="text-right text-muted-foreground">
            {r.count} ({total ? Math.round((r.count / total) * 100) : 0}%)
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function DuenoInformesPage() {
  const { supabase } = await requireProfile();

  const [{ data: socios }, { data: healthRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, member_number")
      .eq("role", "socio")
      .order("member_number")
      .returns<SocioRow[]>(),
    supabase.from("health_profiles").select("*").returns<HealthProfile[]>(),
  ]);

  const sociosList = socios ?? [];
  const healthList = healthRows ?? [];
  const healthById = new Map(healthList.map((h) => [h.socio_id, h]));
  const withFicha = healthList.filter((h) => sociosList.some((s) => s.id === h.socio_id));
  const total = withFicha.length;

  const ages = withFicha.map((h) => ageFromBirthDate(h.birth_date));
  const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;

  const ageRows = AGE_RANGES.map((r) => ({
    label: r.label,
    count: ages.filter((a) => a >= r.min && a <= r.max).length,
  }));

  const sexRows = [...Object.entries(SEX_LABEL), ["", "Sin indicar"]].map(([value, label]) => ({
    label,
    count: withFicha.filter((h) => (h.sex ?? "") === value).length,
  }));

  const activityRows = [...Object.entries(ACTIVITY_LABEL), ["", "Sin indicar"]].map(([value, label]) => ({
    label: label.split(" (")[0],
    count: withFicha.filter((h) => (h.activity_level ?? "") === value).length,
  }));

  const bmiRows = ["Bajo peso", "Peso normal", "Sobrepeso", "Obesidad"].map((label) => ({
    label,
    count: withFicha.filter((h) => bmiCategory(bmi(h.weight_kg, h.height_cm)) === label).length,
  }));

  const conditionRows = CONDITIONS.map((c) => ({
    label: c.label.split(" (")[0],
    count: withFicha.filter((h) => h.conditions.includes(c.value)).length,
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const withInjuries = withFicha.filter((h) => h.injuries?.trim()).length;

  const flagged = sociosList
    .map((s) => ({ socio: s, health: healthById.get(s.id) }))
    .filter((x): x is { socio: SocioRow; health: HealthProfile } => Boolean(x.health))
    .map((x) => ({ ...x, risk: assessRisk(x.health) }))
    .filter((x) => x.risk.level !== "ninguno")
    .sort((a, b) => (a.risk.level === b.risk.level ? 0 : a.risk.level === "consultar_medico" ? -1 : 1));

  const withoutFicha = sociosList.filter((s) => !healthById.has(s.id));
  const coverage = sociosList.length ? Math.round((total / sociosList.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Informes de socios</h1>
        <p className="text-muted-foreground">
          Perfil de tus socios según su ficha de salud: edad, condición física y alertas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{sociosList.length}</CardTitle>
            <CardDescription>Socios registrados</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {total} <span className="text-base font-normal text-muted-foreground">({coverage}%)</span>
            </CardTitle>
            <CardDescription>Con ficha de salud</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{avgAge !== null ? `${avgAge} años` : "—"}</CardTitle>
            <CardDescription>Edad promedio</CardDescription>
          </CardHeader>
        </Card>
        <Card className={flagged.length > 0 ? "border-yellow-500" : undefined}>
          <CardHeader>
            <CardTitle>{flagged.length}</CardTitle>
            <CardDescription>Socios con alertas de salud</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground">
          Aún nadie ha llenado su ficha. Los socios la llenan en &quot;Mi ficha&quot; o tú puedes llenarla
          con ellos desde Socios.
        </p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Edad</CardTitle>
                <CardDescription>Socios por rango de edad</CardDescription>
              </CardHeader>
              <CardContent>
                <Bars rows={ageRows} total={total} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sexo</CardTitle>
              </CardHeader>
              <CardContent>
                <Bars rows={sexRows.filter((r) => r.count > 0)} total={total} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Actividad física al inscribirse</CardTitle>
              </CardHeader>
              <CardContent>
                <Bars rows={activityRows.filter((r) => r.count > 0)} total={total} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Índice de masa corporal</CardTitle>
                <CardDescription>Solo socios con peso y estatura</CardDescription>
              </CardHeader>
              <CardContent>
                <Bars rows={bmiRows.filter((r) => r.count > 0)} total={total} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Condiciones de salud más comunes</CardTitle>
              <CardDescription>
                {withInjuries} {withInjuries === 1 ? "socio reporta" : "socios reportan"} lesiones o cirugías.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conditionRows.length > 0 ? (
                <Bars rows={conditionRows} total={total} />
              ) : (
                <p className="text-sm text-muted-foreground">Nadie ha reportado condiciones.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Socios que requieren atención</CardTitle>
              <CardDescription>
                Primero los que conviene mandar con visto bueno médico. Revisa su ficha antes de
                darles rutina.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {flagged.length === 0 && (
                <p className="text-sm text-muted-foreground">Ningún socio tiene alertas.</p>
              )}
              {flagged.map(({ socio, health, risk }) => (
                <div
                  key={socio.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {socio.full_name ?? "Sin nombre"}{" "}
                      <span className="font-normal text-muted-foreground">
                        #{socio.member_number} · {ageFromBirthDate(health.birth_date)} años
                      </span>
                    </p>
                    <p className="text-muted-foreground">{risk.reasons.join(" · ")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={risk.level === "consultar_medico" ? "destructive" : "secondary"}>
                      {RISK_LABEL[risk.level]}
                    </Badge>
                    <Link href={`/staff/socios/${socio.id}/ficha`} className="underline">
                      Ver ficha
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {withoutFicha.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Socios sin ficha de salud ({withoutFicha.length})</CardTitle>
            <CardDescription>Pídeles que la llenen o llénala con ellos en recepción.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {withoutFicha.map((s) => (
              <Link
                key={s.id}
                href={`/staff/socios/${s.id}/ficha`}
                className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
              >
                {s.full_name ?? "Sin nombre"} #{s.member_number}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
