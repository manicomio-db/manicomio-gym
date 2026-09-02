import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/lib/types";
import { sendMessage } from "../actions";

const ROLE_LABEL: Record<string, string> = {
  socio: "Tú",
  staff: "Staff",
  dueno: "Director",
};

export default async function SocioMensajesPage() {
  const { profile, supabase } = await requireProfile();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("socio_id", profile.id)
    .order("created_at", { ascending: true })
    .returns<Message[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mensajes</h1>
        <p className="text-muted-foreground">Escríbenos tus dudas o comentarios.</p>
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
                    ? "ml-auto max-w-[80%] rounded-md bg-primary/15 p-3 text-sm"
                    : "mr-auto max-w-[80%] rounded-md border p-3 text-sm"
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
            <p className="text-muted-foreground">Aún no tienes mensajes. Escribe el primero abajo.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escribir mensaje</CardTitle>
          <CardDescription>El staff verá tu mensaje y te responderá aquí mismo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={sendMessage} className="flex flex-col gap-3">
            <Textarea name="body" placeholder="Escribe tu duda o comentario..." required />
            <Button type="submit" className="w-fit">
              Enviar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
