import Link from "next/link";
import { requireProfile } from "@/lib/supabase/session";
import { todayLocal, formatDateOnlyLocal } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ageFromBirthDate, assessRisk, bmi, bmiCategory, RISK_LABEL } from "@/lib/health";
import type { HealthProfile, Profile } from "@/lib/types";
import { HealthProfileForm } from "../../../../health-profile-form";

export default async function StaffFichaPage({
  params,
}: {
  params: Promise<{ socioId: string }>;
}) {
  const { supabase } = await requireProfile();
  const { socioId } = await params;

  const [{ data: socio }, { data: health }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", socioId).maybeSingle<Profile>(),
    supabase
      .from("health_profiles")
      .select("*")
      .eq("socio_id", socioId)
      .maybeSingle<HealthProfile>(),
  ]);

  const risk = health ? assessRisk(health) : null;
  const imc = health ? bmi(health.weight_kg, health.height_cm) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/staff/socios" className="text-sm text-muted-foreground underline">
          ← Socios
        </Link>
        <h1 className="text-2xl font-bold">
          Ficha de salud — {socio?.full_name ?? "Socio"}{" "}
          <span className="text-lg font-normal text-muted-foreground">#{socio?.member_number}</span>
        </h1>
      </div>

      {health && risk && (
        <Card
          className={
            risk.level === "consultar_medico"
              ? "border-red-500"
              : risk.level === "precaucion"
                ? "border-yellow-500"
                : "border-green-500"
          }
        >
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {ageFromBirthDate(health.birth_date)} años
              {imc && (
                <span className="text-base font-normal text-muted-foreground">
                  · IMC {imc} ({bmiCategory(imc)})
                </span>
              )}
              <Badge variant={risk.level === "consultar_medico" ? "destructive" : "secondary"}>
                {RISK_LABEL[risk.level]}
              </Badge>
            </CardTitle>
            <CardDescription>
              Contacto de emergencia:{" "}
              {health.emergency_name || health.emergency_phone
                ? `${health.emergency_name ?? "—"} · ${health.emergency_phone ?? "—"}`
                : "no registrado"}
            </CardDescription>
          </CardHeader>
          {risk.reasons.length > 0 && (
            <CardContent>
              <ul className="list-disc pl-5 text-sm">
                {risk.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{health ? "Editar ficha" : "Llenar ficha con el socio"}</CardTitle>
          <CardDescription>
            {health
              ? `Última actualización: ${formatDateOnlyLocal(health.updated_at)}`
              : "Hazle las preguntas en persona y confirma que autoriza el uso de sus datos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HealthProfileForm socioId={socioId} initial={health ?? null} maxDate={todayLocal()} />
        </CardContent>
      </Card>
    </div>
  );
}
