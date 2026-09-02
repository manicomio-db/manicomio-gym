import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PaymentProof } from "@/lib/types";
import { markProofReviewed } from "../actions";

type ProofRow = PaymentProof & { profiles: { full_name: string | null; member_number: number | null } | null };

export default async function StaffComprobantesPage() {
  const { supabase } = await requireProfile();

  const { data: proofs } = await supabase
    .from("payment_proofs")
    .select("*, profiles!payment_proofs_socio_id_fkey(full_name, member_number)")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<ProofRow[]>();

  const proofsWithUrls = await Promise.all(
    (proofs ?? []).map(async (p) => {
      const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(p.file_path, 3600);
      return { ...p, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Comprobantes de pago</h1>
        <p className="text-muted-foreground">
          Revisa cada uno y, si el pago llegó, activa la membresía desde Socios.
        </p>
      </div>

      {proofsWithUrls.length > 0 ? (
        <div className="grid gap-4">
          {proofsWithUrls.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {p.profiles?.full_name ?? "Socio"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      #{p.profiles?.member_number}
                    </span>
                  </CardTitle>
                  <CardDescription>{new Date(p.created_at).toLocaleString("es-MX")}</CardDescription>
                </div>
                <Badge variant={p.status === "revisado" ? "default" : "secondary"}>
                  {p.status === "revisado" ? "Revisado" : "Pendiente"}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm">
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noreferrer" className="underline">
                      Ver comprobante
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Archivo no disponible</span>
                  )}
                  {p.note && <p className="mt-1 text-muted-foreground">{p.note}</p>}
                </div>
                {p.status === "pendiente" && (
                  <form action={markProofReviewed}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit" size="sm">
                      Marcar revisado
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aún no hay comprobantes.</p>
      )}
    </div>
  );
}
