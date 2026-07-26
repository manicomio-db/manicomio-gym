import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MembershipPlan } from "@/lib/types";
import { PlanForm, PlanCard } from "./plan-form";

export default async function DuenoPlanesPage() {
  const { supabase } = await requireProfile();
  const { data: plans } = await supabase
    .from("membership_plans")
    .select("*")
    .order("price")
    .returns<MembershipPlan[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Planes de membresía</h1>
        <p className="text-muted-foreground">Estos precios se muestran en la página principal.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo plan</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(plans ?? []).map((p) => (
          <PlanCard key={p.id} plan={p} />
        ))}
      </div>
    </div>
  );
}
