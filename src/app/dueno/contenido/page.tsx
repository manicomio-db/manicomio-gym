import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { upsertGymInfo } from "../actions";

export default async function DuenoContenidoPage() {
  const { supabase } = await requireProfile();
  const { data: rows } = await supabase.from("gym_info").select("key,value");
  const info = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value ?? ""]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Contenido de la página principal</h1>
        <p className="text-muted-foreground">Esta información se muestra a cualquier visitante.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
          <CardDescription>Nombre, mensaje de bienvenida, horario y contacto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={upsertGymInfo} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre_gimnasio">Nombre del gimnasio</Label>
              <Input id="nombre_gimnasio" name="nombre_gimnasio" defaultValue={info.nombre_gimnasio} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="texto_bienvenida">Mensaje de bienvenida</Label>
              <Textarea id="texto_bienvenida" name="texto_bienvenida" defaultValue={info.texto_bienvenida} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="horario_general">Horario general</Label>
              <Input id="horario_general" name="horario_general" defaultValue={info.horario_general} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contacto_telefono">Teléfono de contacto</Label>
              <Input id="contacto_telefono" name="contacto_telefono" defaultValue={info.contacto_telefono} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contacto_direccion">Dirección</Label>
              <Input id="contacto_direccion" name="contacto_direccion" defaultValue={info.contacto_direccion} />
            </div>
            <Button type="submit" className="w-fit">
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
