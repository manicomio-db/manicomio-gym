import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GymClass } from "@/lib/types";
import { ClassForm, ClassCard } from "./class-form";

export default async function DuenoClasesPage() {
  const { supabase } = await requireProfile();
  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .order("name")
    .returns<GymClass[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Clases</h1>
        <p className="text-muted-foreground">El horario se muestra en la página principal.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva clase</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(classes ?? []).map((c) => (
          <ClassCard key={c.id} gymClass={c} />
        ))}
      </div>
    </div>
  );
}
