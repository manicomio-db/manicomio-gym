import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PaymentProof } from "@/lib/types";
import { UploadProofForm } from "./upload-proof-form";

export default async function SocioPagoPage() {
  const { profile, supabase } = await requireProfile();

  const [{ data: infoRows }, { data: proofs }] = await Promise.all([
    supabase.from("gym_info").select("key,value"),
    supabase
      .from("payment_proofs")
      .select("*")
      .eq("socio_id", profile.id)
      .order("created_at", { ascending: false })
      .returns<PaymentProof[]>(),
  ]);

  const info = Object.fromEntries((infoRows ?? []).map((r) => [r.key, r.value ?? ""]));

  const proofsWithUrls = await Promise.all(
    (proofs ?? []).map(async (p) => {
      const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(p.file_path, 3600);
      return { ...p, url: data?.signedUrl ?? null };
    })
  );

  const hasBankInfo = info.banco_nombre || info.banco_cuenta || info.banco_clabe;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mi pago</h1>
        <p className="text-muted-foreground">Datos para transferir y subir tu comprobante.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos para transferencia</CardTitle>
        </CardHeader>
        <CardContent>
          {hasBankInfo ? (
            <div className="flex flex-col gap-1 text-sm">
              {info.banco_nombre && (
                <p>
                  <span className="text-muted-foreground">Banco:</span> {info.banco_nombre}
                </p>
              )}
              {info.banco_titular && (
                <p>
                  <span className="text-muted-foreground">Titular:</span> {info.banco_titular}
                </p>
              )}
              {info.banco_cuenta && (
                <p>
                  <span className="text-muted-foreground">Cuenta:</span> {info.banco_cuenta}
                </p>
              )}
              {info.banco_clabe && (
                <p>
                  <span className="text-muted-foreground">CLABE:</span> {info.banco_clabe}
                </p>
              )}
              {info.banco_notas && <p className="mt-2 text-muted-foreground">{info.banco_notas}</p>}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Aún no se han publicado los datos de transferencia. Pregunta al staff cómo pagar.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subir comprobante</CardTitle>
          <CardDescription>Súbelo después de hacer tu transferencia.</CardDescription>
        </CardHeader>
        <CardContent>
          <UploadProofForm />
        </CardContent>
      </Card>

      {proofsWithUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mis comprobantes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {proofsWithUrls.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noreferrer" className="underline">
                      Ver comprobante
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Archivo no disponible</span>
                  )}
                  <p className="text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("es-MX")}
                    {p.note && ` · ${p.note}`}
                  </p>
                </div>
                <Badge variant={p.status === "revisado" ? "default" : "secondary"}>
                  {p.status === "revisado" ? "Revisado" : "Pendiente"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
