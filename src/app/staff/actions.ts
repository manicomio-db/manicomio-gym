"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayLocal, addPlanDuration, localDateOf } from "@/lib/date";
import { generateSocioQrDataUrl } from "@/lib/qr";
import type { RoutineContent } from "@/lib/types";

async function requireStaff() {
  const { profile, supabase } = await requireProfile();
  if (profile.role !== "staff" && profile.role !== "dueno") {
    throw new Error("No autorizado");
  }
  return { profile, supabase };
}

export async function saveRoutine(input: {
  requestId: string | null;
  socioId: string;
  title: string;
  contenido: RoutineContent;
  source: "ia" | "manual";
}) {
  const { profile, supabase } = await requireStaff();

  const { error: insertError } = await supabase.from("routines").insert({
    socio_id: input.socioId,
    staff_id: profile.id,
    request_id: input.requestId,
    title: input.title,
    contenido: input.contenido,
    source: input.source,
  });

  if (insertError) {
    console.error("saveRoutine insert error:", insertError);
    throw new Error(insertError.message);
  }

  if (input.requestId) {
    const { error: updateError } = await supabase
      .from("routine_requests")
      .update({ status: "completado" })
      .eq("id", input.requestId);

    if (updateError) {
      console.error("saveRoutine status update error:", updateError);
      throw new Error(updateError.message);
    }
  }

  revalidatePath("/staff/rutinas");
  revalidatePath("/socio/rutina");
}

export async function markInProgress(requestId: string) {
  const { supabase } = await requireStaff();
  await supabase.from("routine_requests").update({ status: "en_progreso" }).eq("id", requestId);
  revalidatePath("/staff/rutinas");
}

export async function discardRequest(requestId: string) {
  const { supabase } = await requireStaff();
  await supabase.from("routine_requests").delete().eq("id", requestId);
  revalidatePath("/staff/rutinas");
  revalidatePath("/socio/rutina");
}

export async function registerSale(formData: FormData) {
  const { profile, supabase } = await requireStaff();

  const productId = String(formData.get("product_id") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const saleDate = String(formData.get("sale_date") ?? "") || todayLocal();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (!product || quantity < 1 || product.stock < quantity) return;

  const total = Number(product.price) * quantity;

  await supabase.from("sales").insert({
    product_id: productId,
    staff_id: profile.id,
    quantity,
    total,
    sale_date: saleDate,
  });

  await supabase
    .from("products")
    .update({ stock: product.stock - quantity })
    .eq("id", productId);

  revalidatePath("/staff/ventas");
  revalidatePath("/dueno/ingresos");
}

export async function updateMembership(formData: FormData) {
  const { profile, supabase } = await requireStaff();

  // El staff no puede activar/renovar sin comprobante: debe hacerlo desde
  // Comprobantes (pago del socio) o con "Registrar pago" (efectivo, adjunta
  // foto). Solo el dueño puede ajustar una membresía libremente.
  if (profile.role !== "dueno") {
    throw new Error(
      "El staff debe activar la membresía desde Comprobantes o con Registrar pago (adjuntando el comprobante)."
    );
  }

  const socioId = String(formData.get("socio_id") ?? "");
  const planId = String(formData.get("plan_id") ?? "") || null;
  const endDate = String(formData.get("end_date") ?? "");
  const startDate = String(formData.get("start_date") ?? todayLocal());
  const amountPaid = formData.get("amount_paid");

  if (!socioId || !endDate) return;

  // Cada activación/renovación se guarda como una fila nueva (historial real de
  // cobros) en vez de sobrescribir la anterior, para poder reportar ingresos.
  await supabase.from("memberships").insert({
    socio_id: socioId,
    plan_id: planId,
    start_date: startDate,
    end_date: endDate,
    status: "activo",
    amount_paid: amountPaid ? Number(amountPaid) : null,
    created_by: profile.id,
  });

  revalidatePath("/staff/socios");
  revalidatePath("/dueno/socios");
  revalidatePath("/dueno/ingresos");
}

export async function registerDayPass(formData: FormData) {
  const { profile, supabase } = await requireStaff();

  const visitorName = String(formData.get("visitor_name") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);

  if (!visitorName || amount <= 0) return;

  await supabase.from("day_passes").insert({
    visitor_name: visitorName,
    amount,
    staff_id: profile.id,
  });

  revalidatePath("/staff/acceso");
  revalidatePath("/dueno/ingresos");
}

export type CheckInState = {
  error: string | null;
  result: {
    name: string;
    memberNumber: number;
    status: "activo" | "vencido" | "sin_membresia";
    endDate: string | null;
    avatarUrl: string | null;
    /** true si ya tenía una entrada hoy: no se vuelve a registrar. */
    alreadyRegistered: boolean;
    /** Instante (ISO) de la entrada de hoy — la nueva o la que ya existía. */
    checkedInAt: string;
  } | null;
};

export async function registerCheckIn(
  _prev: CheckInState,
  formData: FormData
): Promise<CheckInState> {
  const { profile, supabase } = await requireStaff();

  const memberNumber = Number(formData.get("member_number") ?? "");
  if (!memberNumber) {
    return { error: "Escribe un número de socio válido.", result: null };
  }

  const { data: socio } = await supabase
    .from("profiles")
    .select("*")
    .eq("member_number", memberNumber)
    .eq("role", "socio")
    .maybeSingle();

  if (!socio) {
    return { error: `No se encontró ningún socio con el número ${memberNumber}.`, result: null };
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("end_date")
    .eq("socio_id", socio.id)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const today = todayLocal();
  const status: "activo" | "vencido" | "sin_membresia" = !membership
    ? "sin_membresia"
    : membership.end_date >= today
      ? "activo"
      : "vencido";

  // Una sola entrada por socio por día (día del gimnasio, no UTC). Se revisan las
  // últimas 36 h y se compara la fecha local de cada una.
  const since = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("check_ins")
    .select("created_at")
    .eq("socio_id", socio.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const existingToday = (recent ?? []).find((c) => localDateOf(c.created_at) === today);

  let checkedInAt = existingToday?.created_at ?? new Date().toISOString();

  if (!existingToday) {
    const { data: inserted } = await supabase
      .from("check_ins")
      .insert({ socio_id: socio.id, staff_id: profile.id })
      .select("created_at")
      .single();
    if (inserted) checkedInAt = inserted.created_at;
    revalidatePath("/staff/acceso");
  }

  return {
    error: null,
    result: {
      name: socio.full_name ?? "Socio",
      memberNumber: socio.member_number,
      status,
      endDate: membership?.end_date ?? null,
      avatarUrl: socio.avatar_url ?? null,
      alreadyRegistered: Boolean(existingToday),
      checkedInAt,
    },
  };
}

export type ResetPasswordState = { error: string | null; success: boolean };

export async function resetSocioPassword(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  await requireStaff();

  const socioId = String(formData.get("socio_id") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");

  if (!socioId) return { error: "Falta el socio.", success: false };
  if (newPassword.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres.", success: false };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.", success: false };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(socioId, { password: newPassword });

  if (error) {
    return { error: "No se pudo cambiar la contraseña.", success: false };
  }

  return { error: null, success: true };
}

export async function getSocioQrDataUrl(memberNumber: number): Promise<string> {
  await requireStaff();
  return generateSocioQrDataUrl(memberNumber);
}

export async function uploadSocioAvatar(formData: FormData) {
  await requireStaff();

  const socioId = String(formData.get("socio_id") ?? "");
  const file = formData.get("file");
  if (!socioId || !(file instanceof File) || file.size === 0) return;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.");
  }

  const admin = createAdminClient();
  const path = `${socioId}/avatar`;

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type || undefined, upsert: true });

  if (uploadError) {
    console.error("uploadSocioAvatar error:", uploadError);
    throw new Error(uploadError.message);
  }

  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

  await admin.from("profiles").update({ avatar_url: avatarUrl }).eq("id", socioId);

  revalidatePath("/staff/socios");
  revalidatePath("/staff/acceso");
  revalidatePath("/socio");
}

export async function markProofReviewed(formData: FormData) {
  const { profile, supabase } = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase
    .from("payment_proofs")
    .update({ status: "revisado", reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/staff/comprobantes");
}

export type RenewalResult = { error: string | null };

// Ventana en la que no se permite una segunda activación del mismo socio por las
// vías del staff: evita meses de más por doble clic o por registrar el mismo pago
// dos veces (en Comprobantes y otra vez en Registrar pago).
const DUPLICATE_WINDOW_HOURS = 24;

/** Mensaje de error si no se debe activar de nuevo a este socio; null si se puede. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cliente Supabase tipado genéricamente
async function renewalBlockReason(supabase: any, socioId: string): Promise<string | null> {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("memberships")
    .select("created_at")
    .eq("socio_id", socioId)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();

  if (recent) {
    return "A este socio ya se le activó una membresía en las últimas 24 horas. Para evitar cobrarle meses de más no se puede activar otra vez. Si fue un error, avisa al dueño para que lo corrija.";
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- cliente Supabase tipado genéricamente
async function insertRenewal(supabase: any, opts: {
  socioId: string;
  planId: string;
  amountRaw: FormDataEntryValue | null;
  createdBy: string;
}): Promise<RenewalResult> {
  const { data: plan } = await supabase
    .from("membership_plans")
    .select("duration_days, price")
    .eq("id", opts.planId)
    .single();

  if (!plan) return { error: "No se encontró el plan elegido." };

  const today = todayLocal();

  // Si la membresía actual sigue vigente, la renovación se agrega a partir de su
  // vencimiento; si ya venció (o no existe), arranca hoy.
  const { data: last } = await supabase
    .from("memberships")
    .select("end_date")
    .eq("socio_id", opts.socioId)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const base = last && last.end_date > today ? last.end_date : today;

  const { error } = await supabase.from("memberships").insert({
    socio_id: opts.socioId,
    plan_id: opts.planId,
    start_date: today,
    end_date: addPlanDuration(base, plan.duration_days),
    status: "activo",
    amount_paid: opts.amountRaw ? Number(opts.amountRaw) : Number(plan.price),
    created_by: opts.createdBy,
  });

  if (error) {
    console.error("insertRenewal error:", error);
    return { error: "No se pudo guardar la membresía. Intenta de nuevo." };
  }
  return { error: null };
}

function revalidateAfterRenewal() {
  revalidatePath("/staff/comprobantes");
  revalidatePath("/staff/socios");
  revalidatePath("/staff");
  revalidatePath("/dueno");
  revalidatePath("/dueno/ingresos");
  revalidatePath("/socio");
  revalidatePath("/socio/pago");
}

export async function activateMembershipFromProof(formData: FormData): Promise<RenewalResult> {
  const { profile, supabase } = await requireStaff();

  const proofId = String(formData.get("proof_id") ?? "");
  const socioId = String(formData.get("socio_id") ?? "");
  const planId = String(formData.get("plan_id") ?? "");

  if (!proofId || !socioId || !planId) return { error: "Faltan datos para activar." };

  const blocked = await renewalBlockReason(supabase, socioId);
  if (blocked) return { error: blocked };

  // El comprobante se "reclama" primero y de forma atómica (solo si sigue
  // pendiente): si se manda dos veces, la segunda ya no lo encuentra pendiente.
  const { data: claimed } = await supabase
    .from("payment_proofs")
    .update({ status: "revisado", reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
    .eq("id", proofId)
    .eq("status", "pendiente")
    .select("id");

  if (!claimed || claimed.length === 0) {
    revalidatePath("/staff/comprobantes");
    return { error: "Este comprobante ya fue revisado: ya se activó o se descartó." };
  }

  const result = await insertRenewal(supabase, {
    socioId,
    planId,
    amountRaw: formData.get("amount_paid"),
    createdBy: profile.id,
  });

  if (result.error) {
    // Si no se pudo activar, el comprobante vuelve a quedar pendiente.
    await supabase
      .from("payment_proofs")
      .update({ status: "pendiente", reviewed_by: null, reviewed_at: null })
      .eq("id", proofId);
    return result;
  }

  revalidateAfterRenewal();
  return { error: null };
}

/**
 * Pago en efectivo / en recepción: el staff adjunta la foto del comprobante y
 * activa en un solo paso. El comprobante queda guardado y visible para el dueño
 * en Comprobantes; sin archivo no se puede activar.
 */
export async function activateMembershipWithProof(formData: FormData): Promise<RenewalResult> {
  const { profile, supabase } = await requireStaff();

  const socioId = String(formData.get("socio_id") ?? "");
  const planId = String(formData.get("plan_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const file = formData.get("file");

  if (!socioId || !planId) return { error: "Faltan datos para activar." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Debes adjuntar la foto o el comprobante del pago." };
  }

  // Antes de subir nada: ¿ya se activó hace poco o hay un comprobante del socio
  // esperando? En ese caso el pago ya está registrado por otra vía.
  const blocked = await renewalBlockReason(supabase, socioId);
  if (blocked) return { error: blocked };

  const { data: pendingProof } = await supabase
    .from("payment_proofs")
    .select("id")
    .eq("socio_id", socioId)
    .eq("status", "pendiente")
    .limit(1)
    .maybeSingle();

  if (pendingProof) {
    return {
      error:
        "Este socio ya envió un comprobante que está pendiente. Actívalo desde Comprobantes para no registrar el mismo pago dos veces.",
    };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${socioId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, file, { contentType: file.type || undefined });

  if (uploadError) {
    console.error("activateMembershipWithProof upload error:", uploadError);
    return { error: "No se pudo subir el comprobante. Intenta de nuevo." };
  }

  const { data: proof, error: proofError } = await supabase
    .from("payment_proofs")
    .insert({
      socio_id: socioId,
      file_path: path,
      note: note || "Pago registrado en recepción",
      status: "revisado",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (proofError || !proof) {
    console.error("activateMembershipWithProof proof insert error:", proofError);
    return { error: "No se pudo guardar el comprobante. Intenta de nuevo." };
  }

  const result = await insertRenewal(supabase, {
    socioId,
    planId,
    amountRaw: formData.get("amount_paid"),
    createdBy: profile.id,
  });

  if (result.error) {
    // No quedó activa: se anota en el comprobante para que no parezca un pago activado.
    await supabase
      .from("payment_proofs")
      .update({ note: "(No se activó la membresía: hubo un error al guardarla)" })
      .eq("id", proof.id);
    return result;
  }

  revalidateAfterRenewal();
  return { error: null };
}

export async function replyMessage(formData: FormData) {
  const { profile, supabase } = await requireStaff();
  const socioId = String(formData.get("socio_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!socioId || !body) return;

  await supabase.from("messages").insert({
    socio_id: socioId,
    sender_id: profile.id,
    sender_role: profile.role,
    body,
  });

  revalidatePath(`/staff/mensajes/${socioId}`);
  revalidatePath("/staff/mensajes");
  revalidatePath("/socio/mensajes");
}
