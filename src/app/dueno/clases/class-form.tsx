"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GymClass } from "@/lib/types";
import { upsertClass, deleteClass } from "../actions";

export function ClassForm({ gymClass, onDone }: { gymClass?: GymClass; onDone?: () => void }) {
  const [pending, setPending] = useState(false);

  async function action(formData: FormData) {
    setPending(true);
    try {
      await upsertClass(formData);
      toast.success(gymClass ? "Clase actualizada." : "Clase creada.");
      onDone?.();
    } catch {
      toast.error("No se pudo guardar la clase.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      {gymClass && <input type="hidden" name="id" value={gymClass.id} />}
      <div className="flex flex-col gap-2">
        <Label>Nombre</Label>
        <Input name="name" defaultValue={gymClass?.name} required />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Label>Horario</Label>
          <Input name="schedule" placeholder="Lun/Mié/Vie 7:00 AM" defaultValue={gymClass?.schedule ?? ""} />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label>Cupo</Label>
          <Input name="capacity" type="number" defaultValue={gymClass?.capacity ?? ""} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Descripción</Label>
        <Textarea name="description" defaultValue={gymClass?.description ?? ""} />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando..." : gymClass ? "Guardar cambios" : "Crear clase"}
      </Button>
    </form>
  );
}

export function ClassCard({ gymClass }: { gymClass: GymClass }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ClassForm gymClass={gymClass} onDone={() => setEditing(false)} />
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="mt-2">
            Cancelar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{gymClass.name}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <form
            action={async (formData) => {
              await deleteClass(formData);
              toast.success("Clase eliminada.");
            }}
          >
            <input type="hidden" name="id" value={gymClass.id} />
            <Button size="sm" variant="destructive" type="submit">
              Eliminar
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium">{gymClass.schedule}</p>
        {gymClass.capacity && (
          <p className="text-sm text-muted-foreground">Cupo: {gymClass.capacity}</p>
        )}
        {gymClass.description && (
          <p className="mt-1 text-sm text-muted-foreground">{gymClass.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
