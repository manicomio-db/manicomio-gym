"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getSocioQrDataUrl } from "../actions";

export function QrDialog({
  memberNumber,
  socioNombre,
}: {
  memberNumber: number | null;
  socioNombre: string;
}) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !qr && memberNumber) {
      setLoading(true);
      try {
        setQr(await getSocioQrDataUrl(memberNumber));
      } catch {
        setQr(null);
      } finally {
        setLoading(false);
      }
    }
  }

  if (!memberNumber) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Ver QR</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR de {socioNombre}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          {loading && <p className="text-sm text-muted-foreground">Generando...</p>}
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt={`QR de ${socioNombre}`}
              className="h-64 w-64 rounded-md border bg-white p-3"
            />
          )}
          <p className="text-center text-sm text-muted-foreground">
            Muéstralo o imprímelo para que el socio lo use en Control de acceso.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
