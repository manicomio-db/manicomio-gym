import { requireProfile } from "@/lib/supabase/session";
import { todayLocal, formatDateOnlyLocal } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { HealthProfile } from "@/lib/types";
import { HealthProfileForm } from "../../health-profile-form";

export default async function SocioFichaPage() {
  const { profile, supabase } = await requireProfile();

  const { data: health } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("socio_id", profile.id)
    .maybeSingle<HealthProfile>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mi ficha de salud</h1>
        <p className="text-muted-foreground">
          Con esta información tu instructor adapta la rutina a tu edad, condición y lesiones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{health ? "Actualiza tu ficha" : "Llena tu ficha"}</CardTitle>
          <CardDescription>
            {health
              ? `Última actualización: ${formatDateOnlyLocal(health.updated_at)}`
              : "Es necesaria para pedir una rutina. Tus datos solo los ve el staff del gimnasio."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HealthProfileForm initial={health ?? null} maxDate={todayLocal()} />
        </CardContent>
      </Card>
    </div>
  );
}
