"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayLocal } from "@/lib/date";
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

  await supabase.from("check_ins").insert({ socio_id: socio.id, staff_id: profile.id });

  revalidatePath("/staff/acceso");

  return {
    error: null,
    result: {
      name: socio.full_name ?? "Socio",
      memberNumber: socio.member_number,
      status,
      endDate: membership?.end_date ?? null,
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
