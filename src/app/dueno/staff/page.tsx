import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";
import { StaffForm } from "./staff-form";
import { removeStaff } from "../actions";

export default async function DuenoStaffPage() {
  const { supabase } = await requireProfile();
  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["staff", "dueno"])
    .order("full_name")
    .returns<Profile[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Staff</h1>
        <p className="text-muted-foreground">
          Solo el director puede crear cuentas de staff/instructores.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva cuenta de staff</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffForm />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(staff ?? []).map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>{s.full_name ?? "Sin nombre"}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground capitalize">{s.role}</span>
              {s.role === "staff" && (
                <form action={removeStaff}>
                  <input type="hidden" name="id" value={s.id} />
                  <Button type="submit" size="sm" variant="destructive">
                    Revocar acceso
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
