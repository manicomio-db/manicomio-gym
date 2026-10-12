"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/session";
import type { RoutineFeedback } from "@/lib/types";

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

  const { data: health } = await supabase
    .from("health_profiles")
    .select("socio_id")
    .eq("socio_id", profile.id)
    .maybeSingle();

  if (!health) {
    return { error: "Primero llena tu ficha de salud (menú Mi ficha).", success: false };
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

  // Si ya tuvo una rutina, el formulario pide cómo le fue para diseñar la siguiente.
  const { data: prevRoutine } = await supabase
    .from("routines")
    .select("id")
    .eq("socio_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let feedback: RoutineFeedback | null = null;
  if (prevRoutine) {
    const dificultad = String(formData.get("dificultad") ?? "");
    const logrado = String(formData.get("objetivo_logrado") ?? "");
    if (
      !["muy_facil", "adecuada", "muy_dificil"].includes(dificultad) ||
      !["si", "parcial", "no"].includes(logrado)
    ) {
      return {
        error: "Cuéntanos cómo te fue con tu rutina anterior (dificultad y si lograste tu objetivo).",
        success: false,
      };
    }
    const dias = Number(formData.get("dias_por_semana") ?? "");
    feedback = {
      dificultad: dificultad as RoutineFeedback["dificultad"],
      objetivo_logrado: logrado as RoutineFeedback["objetivo_logrado"],
      dias_por_semana: Number.isInteger(dias) && dias >= 0 && dias <= 7 ? dias : null,
      molestias: String(formData.get("molestias") ?? "").trim().slice(0, 1000) || null,
      comentarios: String(formData.get("comentarios") ?? "").trim().slice(0, 1000) || null,
    };
  }

  await supabase.from("routine_requests").insert({
    socio_id: profile.id,
    objetivo,
    nivel,
    lesiones,
    sesiones_semana: sesiones,
    status: "pendiente",
    prev_routine_id: prevRoutine?.id ?? null,
    feedback,
  });

  revalidatePath("/socio/rutina");
  return { error: null, success: true };
}

export type UploadProofResult = { error: string | null };

export async function uploadPaymentProof(formData: FormData): Promise<UploadProofResult> {
  const { profile, supabase } = await requireProfile();

  const note = String(formData.get("note") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Adjunta la foto o PDF del comprobante." };
  }

  // Un solo comprobante en revisión a la vez: evita duplicados por clics repetidos.
  const { data: pending } = await supabase
    .from("payment_proofs")
    .select("id")
    .eq("socio_id", profile.id)
    .eq("status", "pendiente")
    .limit(1)
    .maybeSingle();

  if (pending) {
    return { error: "Ya enviaste un comprobante y está en revisión. Espera a que el staff lo revise." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, file, { contentType: file.type || undefined });

  if (uploadError) {
    console.error("uploadPaymentProof error:", uploadError);
    throw new Error(uploadError.message);
  }

  await supabase.from("payment_proofs").insert({
    socio_id: profile.id,
    file_path: path,
    note: note || null,
  });

  revalidatePath("/socio/pago");
  revalidatePath("/staff/comprobantes");
  return { error: null };
}

export async function uploadAvatar(formData: FormData) {
  const { profile, supabase } = await requireProfile();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const path = `${profile.id}/avatar`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type || undefined, upsert: true });

  if (uploadError) {
    console.error("uploadAvatar error:", uploadError);
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

  await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", profile.id);

  revalidatePath("/socio");
  revalidatePath("/staff/socios");
}

export async function sendMessage(formData: FormData) {
  const { profile, supabase } = await requireProfile();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await supabase.from("messages").insert({
    socio_id: profile.id,
    sender_id: profile.id,
    sender_role: "socio",
    body,
  });

  revalidatePath("/socio/mensajes");
  revalidatePath("/staff/mensajes");
  revalidatePath(`/staff/mensajes/${profile.id}`);
}
