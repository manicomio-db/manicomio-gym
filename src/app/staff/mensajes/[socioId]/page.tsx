import Link from "next/link";
import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message, Profile } from "@/lib/types";
import { replyMessage } from "../../actions";

const ROLE_LABEL: Record<string, string> = {
  socio: "Socio",
  staff: "Staff",
  dueno: "Director",
};

export default async function StaffMensajeThreadPage({
  params,
}: {
  params: Promise<{ socioId: string }>;
}) {
  const { supabase } = await requireProfile();
  const { socioId } = await params;

  const [{ data: socio }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", socioId).single<Profile>(),
    supabase
      .from("messages")
      .select("*")
      .eq("socio_id", socioId)
      .order("created_at", { ascending: true })
      .returns<Message[]>(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/staff/mensajes" className="text-sm text-muted-foreground underline">
          ← Todos los mensajes
        </Link>
        <h1 className="text-2xl font-bold">
          {socio?.full_name ?? "Socio"}{" "}
          <span className="text-lg font-normal text-muted-foreground">#{socio?.member_number}</span>
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversación</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {messages && messages.length > 0 ? (
            messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.sender_role === "socio"
                    ? "mr-auto max-w-[80%] rounded-md border p-3 text-sm"
                    : "ml-auto max-w-[80%] rounded-md bg-primary/15 p-3 text-sm"
                }
              >
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {ROLE_LABEL[m.sender_role] ?? m.sender_role} ·{" "}
                  {new Date(m.created_at).toLocaleString("es-MX")}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Aún no hay mensajes en esta conversación.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responder</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={replyMessage} className="flex flex-col gap-3">
            <input type="hidden" name="socio_id" value={socioId} />
            <Textarea name="body" placeholder="Escribe tu respuesta..." required />
            <Button type="submit" className="w-fit">
              Enviar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
