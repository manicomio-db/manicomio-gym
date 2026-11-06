import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { GymClass, MembershipPlan } from "@/lib/types";

export const revalidate = 0;

/** "30" → "1 mes", "90" → "3 meses", "365" → "1 año"; si no es redondo, "N días". */
function durationLabel(days: number): string {
  if (days >= 360 && days <= 370) return "1 año de acceso";
  const months = Math.round(days / 30.4375);
  if (months >= 1 && months < 12 && Math.abs(days - months * 30.4375) <= 3 + months) {
    return `${months} ${months === 1 ? "mes" : "meses"} de acceso`;
  }
  return `${days} días de acceso`;
}

export default async function LandingPage() {
  const supabase = await createClient();

  const [{ data: plans }, { data: classes }, { data: infoRows }] = await Promise.all([
    supabase.from("membership_plans").select("*").order("price", { ascending: true }),
    supabase.from("classes").select("*").order("name", { ascending: true }),
    supabase.from("gym_info").select("key,value"),
  ]);

  const info = Object.fromEntries((infoRows ?? []).map((r) => [r.key, r.value ?? ""]));
  const gymName = info.nombre_gimnasio || "Manicomio Gym";

  return (
    // La página de inicio siempre es oscura (el póster lo es), sin importar el tema del teléfono.
    <div className="dark relative flex flex-1 flex-col text-foreground">
      <div className="fixed inset-0 -z-10 bg-background">
        <Image
          src="/landing-bg.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/85 to-black/95" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/50 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Image
            src="/logo.png"
            alt={gymName}
            width={1320}
            height={1283}
            className="w-11 rounded-xl ring-1 ring-white/15 sm:w-12"
            priority
          />
          <nav className="flex items-center gap-2">
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
              Entrar
            </Button>
            <Button nativeButton={false} render={<Link href="/signup" />}>
              Registrarme
            </Button>
          </nav>
        </div>
        <span aria-hidden className="brand-line absolute inset-x-0 bottom-0" />
      </header>

      <section className="px-4 py-12 text-center sm:px-6 sm:py-20">
        <Image
          src="/logo.png"
          alt={gymName}
          width={1320}
          height={1283}
          className="mx-auto w-44 rounded-3xl shadow-2xl shadow-primary/40 ring-1 ring-white/20 sm:w-64"
          priority
        />
        <h1 className="sr-only">{gymName}</h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-white/80 sm:text-lg">
          {info.texto_bienvenida || "Entrena con nosotros y alcanza tus metas."}
        </p>
        <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
            Únete ahora
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
            Ya soy socio
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="mb-6 text-2xl font-extrabold sm:text-3xl">Planes y costos</h2>
        {plans && plans.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(plans as MembershipPlan[]).map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{durationLabel(plan.duration_days)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-extrabold text-primary">
                    ${plan.price.toLocaleString("es-MX")}
                  </p>
                  {plan.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aún no hay planes publicados.</p>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="mb-6 text-2xl font-extrabold sm:text-3xl">Clases</h2>
        {classes && classes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(classes as GymClass[]).map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{c.name}</CardTitle>
                  <CardDescription>{c.schedule}</CardDescription>
                </CardHeader>
                {c.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aún no hay clases publicadas.</p>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="mb-6 text-2xl font-extrabold sm:text-3xl">Contacto</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {info.horario_general && (
            <Card size="sm">
              <CardContent className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Horario</p>
                  <p className="text-sm">{info.horario_general}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {info.contacto_telefono && (
            <Card size="sm">
              <CardContent className="flex items-start gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teléfono</p>
                  <a href={`tel:${info.contacto_telefono.replace(/[^\d+]/g, "")}`} className="text-sm underline-offset-4 hover:underline">
                    {info.contacto_telefono}
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
          {info.contacto_direccion && (
            <Card size="sm">
              <CardContent className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dirección</p>
                  <p className="text-sm">{info.contacto_direccion}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-sm text-white/60">
        {gymName} — Sistema de gestión
      </footer>
    </div>
  );
}
