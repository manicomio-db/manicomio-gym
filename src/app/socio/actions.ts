"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/session";

export type RequestRoutineState = { error: string | null; success: boolean };

export async function requestRoutine(
  _prev: RequestRoutineState,
  formData: FormData
): Promise<RequestRoutineState> {
  const { profile, supabase } = await requireProfile();

  const objetivo = String(formData.get("objetivo") ?? "").trim();
  const nivel = String(formData.get("nivel") ?? "");
  const lesiones = String(formData.get("lesiones") ?? "").trim();
  const sesiones = Number(formData.get("sesiones_semana") ?? 3);

  if (!objetivo) {
    return { error: "Falta el objetivo.", success: false };
  }

  const { data: existing } = await supabase
    .from("routine_requests")
    .select("id")
    .eq("socio_id", profile.id)
    .in("status", ["pendiente", "en_progreso"])
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      error: "Ya tienes una solicitud en trámite. Espera a que tu instructor te asigne la rutina.",
      success: false,
    };
  }

  await supabase.from("routine_requests").insert({
    socio_id: profile.id,
    objetivo,
    nivel,
    lesiones,
    sesiones_semana: sesiones,
    status: "pendiente",
  });

  revalidatePath("/socio/rutina");
  return { error: null, success: true };
}
