"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/session";

export async function requestRoutine(formData: FormData) {
  const { profile, supabase } = await requireProfile();

  const objetivo = String(formData.get("objetivo") ?? "").trim();
  const nivel = String(formData.get("nivel") ?? "");
  const lesiones = String(formData.get("lesiones") ?? "").trim();
  const sesiones = Number(formData.get("sesiones_semana") ?? 3);

  if (!objetivo) return;

  await supabase.from("routine_requests").insert({
    socio_id: profile.id,
    objetivo,
    nivel,
    lesiones,
    sesiones_semana: sesiones,
    status: "pendiente",
  });

  revalidatePath("/socio/rutina");
}
