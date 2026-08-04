"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { resetSocioPassword, type ResetPasswordState } from "../actions";

const initialState: ResetPasswordState = { error: null, success: false };

export function ResetPasswordDialog({ socioId, socioNombre }: { socioId: string; socioNombre: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(resetSocioPassword, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Contraseña actualizada.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the dialog once the action confirms success
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Restablecer contraseña</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva contraseña para {socioNombre}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="socio_id" value={socioId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="new_password">Contraseña nueva</Label>
            <Input id="new_password" name="new_password" type="text" minLength={6} required />
            <p className="text-xs text-muted-foreground">
              Que la escriba o vea el socio directamente, y que la cambie después si quiere.
            </p>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
