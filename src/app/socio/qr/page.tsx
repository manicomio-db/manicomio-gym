import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateSocioQrDataUrl } from "@/lib/qr";

export default async function SocioQrPage() {
  const { profile } = await requireProfile();

  const qrDataUrl = profile.member_number
    ? await generateSocioQrDataUrl(profile.member_number)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mi QR</h1>
        <p className="text-muted-foreground">
          Muéstralo en recepción para registrar tu entrada más rápido.
        </p>
      </div>

      {profile.member_number && qrDataUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>#{profile.member_number}</CardTitle>
            <CardDescription>{profile.full_name ?? "Socio"}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR de ${profile.full_name ?? "socio"}`}
              className="h-72 w-72 rounded-md border bg-white p-3"
            />
            <Button
              nativeButton={false}
              render={<a href={qrDataUrl} download={`qr-manicomio-socio-${profile.member_number}.png`} />}
            >
              Descargar QR
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">Aún no tienes un número de socio asignado.</p>
      )}
    </div>
  );
}
