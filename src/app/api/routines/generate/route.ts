import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireProfile } from "@/lib/supabase/session";

export async function POST(req: Request) {
  const { profile } = await requireProfile();
  if (profile.role !== "staff" && profile.role !== "dueno") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Falta configurar ANTHROPIC_API_KEY en el servidor." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { objetivo, nivel, lesiones, sesiones_semana } = body as {
    objetivo: string;
    nivel: string | null;
    lesiones: string | null;
    sesiones_semana: number | null;
  };

  if (!objetivo) {
    return NextResponse.json({ error: "Falta el objetivo del socio." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const sesiones = sesiones_semana && sesiones_semana > 0 ? sesiones_semana : 3;

  const prompt = `Eres un entrenador personal experto. Diseña una rutina de gimnasio para un socio con estos datos:
- Objetivo: ${objetivo}
- Nivel: ${nivel || "intermedio"}
- Lesiones o condiciones previas: ${lesiones || "ninguna reportada"}
- Sesiones por semana: ${sesiones}

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin texto extra) con esta forma exacta:
{
  "resumen": "string breve describiendo el enfoque de la rutina",
  "dias": [
    {
      "dia": "string, ej. Día 1 - Pierna",
      "ejercicios": [
        { "nombre": "string", "series": "string ej. 4", "reps": "string ej. 8-10", "notas": "string opcional" }
      ]
    }
  ]
}

Incluye exactamente ${sesiones} días. Evita ejercicios que agraven las lesiones reportadas.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "La IA no devolvió un JSON válido." }, { status: 502 });
    }

    const contenido = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ contenido });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error generando la rutina con IA." }, { status: 500 });
  }
}
