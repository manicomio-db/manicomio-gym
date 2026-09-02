import Link from "next/link";
import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Message } from "@/lib/types";

type MessageRow = Message & { profiles: { full_name: string | null; member_number: number | null } | null };

export default async function StaffMensajesPage() {
  const { supabase } = await requireProfile();

  const { data: messages } = await supabase
    .from("messages")
    .select("*, profiles!messages_socio_id_fkey(full_name, member_number)")
    .order("created_at", { ascending: false })
    .returns<MessageRow[]>();

  const latestBySocio = new Map<string, MessageRow>();
  for (const m of messages ?? []) {
    if (!latestBySocio.has(m.socio_id)) latestBySocio.set(m.socio_id, m);
  }
  const threads = Array.from(latestBySocio.values());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mensajes</h1>
        <p className="text-muted-foreground">Conversaciones con tus socios.</p>
      </div>

      {threads.length > 0 ? (
        <div className="grid gap-3">
          {threads.map((t) => (
            <Card key={t.socio_id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {t.profiles?.full_name ?? "Socio"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      #{t.profiles?.member_number}
                    </span>
                  </CardTitle>
                  <CardDescription className="line-clamp-1">{t.body}</CardDescription>
                </div>
                <Link href={`/staff/mensajes/${t.socio_id}`} className="text-sm text-primary underline">
                  Abrir
                </Link>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleString("es-MX")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aún no hay mensajes de ningún socio.</p>
      )}
    </div>
  );
}
