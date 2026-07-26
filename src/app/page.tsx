import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { GymClass, MembershipPlan } from "@/lib/types";

export const revalidate = 0;

export default async function LandingPage() {
  const supabase = await createClient();

  const [{ data: plans }, { data: classes }, { data: infoRows }] = await Promise.all([
    supabase.from("membership_plans").select("*").order("price", { ascending: true }),
    supabase.from("classes").select("*").order("name", { ascending: true }),
    supabase.from("gym_info").select("key,value"),
  ]);

  const info = Object.fromEntries((infoRows ?? []).map((r) => [r.key, r.value ?? ""]));

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-primary/20 px-6 py-3">
        <Image src="/logo.png" alt={info.nombre_gimnasio || "Manicomio Gym"} width={1320} height={1283} className="w-14" priority />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            Iniciar sesión
          </Button>
          <Button nativeButton={false} render={<Link href="/signup" />}>
            Registrarme
          </Button>
        </nav>
      </header>

      <section className="border-b border-primary/20 bg-card/40 px-6 py-16 text-center">
        <Image
          src="/logo.png"
          alt={info.nombre_gimnasio || "Manicomio Gym"}
          width={1320}
          height={1283}
          className="mx-auto w-56 sm:w-72"
          priority
        />
        <h1 className="sr-only">{info.nombre_gimnasio || "Mi Gimnasio"}</h1>
        <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
          {info.texto_bienvenida || "Entrena con nosotros y alcanza tus metas."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
            Únete ahora
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
            Ya soy socio
          </Button>
        </div>
      </section>

      <section className="px-6 py-16">
        <h2 className="mb-6 text-2xl font-bold">Planes y costos</h2>
        {plans && plans.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(plans as MembershipPlan[]).map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.duration_days} días de acceso</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${plan.price.toLocaleString("es-MX")}</p>
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

      <section className="border-t bg-muted/30 px-6 py-16">
        <h2 className="mb-6 text-2xl font-bold">Clases</h2>
        {classes && classes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(classes as GymClass[]).map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle>{c.name}</CardTitle>
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

      <section className="px-6 py-16">
        <h2 className="mb-4 text-2xl font-bold">Contacto</h2>
        <div className="space-y-1 text-muted-foreground">
          {info.horario_general && <p>Horario: {info.horario_general}</p>}
          {info.contacto_telefono && <p>Teléfono: {info.contacto_telefono}</p>}
          {info.contacto_direccion && <p>Dirección: {info.contacto_direccion}</p>}
        </div>
      </section>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        {info.nombre_gimnasio || "Mi Gimnasio"} — Sistema de gestión
      </footer>
    </div>
  );
}
