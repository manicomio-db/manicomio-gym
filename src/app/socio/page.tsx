import Link from "next/link";
import { requireProfile } from "@/lib/supabase/session";
import { todayLocal } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Membership } from "@/lib/types";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function SocioHomePage() {
  const { profile, supabase } = await requireProfile();

  const { data: membership } = await supabase
    .from("memberships")
    .select("*, membership_plans(*)")
    .eq("socio_id", profile.id)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle<Membership>();

  const today = todayLocal();
  const isExpired = membership ? membership.end_date < today : true;
  const daysLeft = membership
    ? Math.ceil(
        (new Date(membership.end_date + "T00:00:00").getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;
  const expiringSoon = !isExpired && daysLeft !== null && daysLeft <= 5;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Hola, {profile.full_name ?? "Socio"}</h1>
        <p className="text-muted-foreground">
          Tu número de socio es <strong>#{profile.member_number}</strong> — dalo en recepción para
          registrar tu entrada.
        </p>
        {profile.username && (
          <p className="text-muted-foreground">
            Tu usuario para entrar es <strong>{profile.username}</strong>.
          </p>
        )}
      </div>

      {(isExpired || expiringSoon) && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">
              {isExpired ? "Tu membresía ya venció" : `Tu membresía vence en ${daysLeft} días`}
            </CardTitle>
            <CardDescription>
              {isExpired
                ? "Renueva tu pago para seguir teniendo acceso al gimnasio."
                : "Renueva a tiempo para no perder tu acceso."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="destructive" render={<Link href="/socio/pago" />}>
              Ver cómo pagar
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Membresía</CardTitle>
          {membership?.membership_plans && (
            <CardDescription>Plan: {membership.membership_plans.name}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {membership ? (
            <div className="flex flex-col gap-2">
              <Badge variant={isExpired ? "destructive" : "default"} className="w-fit">
                {isExpired ? "Vencida" : "Activa"}
              </Badge>
              <p>
                Vence el <strong>{formatDate(membership.end_date)}</strong>
                {!isExpired && daysLeft !== null && (
                  <span className="text-muted-foreground"> ({daysLeft} días restantes)</span>
                )}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Aún no tienes una membresía registrada. Acércate al staff para activarla.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
