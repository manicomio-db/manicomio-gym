"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadPaymentProof } from "../actions";

export function UploadProofForm() {
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function action(formData: FormData) {
    setPending(true);
    try {
      await uploadPaymentProof(formData);
      toast.success("Comprobante enviado. El staff lo va a revisar pronto.");
      setFileName(null);
      const form = document.getElementById("upload-proof-form") as HTMLFormElement | null;
      form?.reset();
    } catch {
      toast.error("No se pudo subir el comprobante.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="upload-proof-form" action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">Foto o PDF del comprobante</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept="image/*,.pdf"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Nota (opcional)</Label>
        <Textarea id="note" name="note" placeholder="Ej: pagué el plan mensual" />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Subiendo..." : "Enviar comprobante"}
      </Button>
    </form>
  );
}
