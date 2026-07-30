"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/session";
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

  await supabase.from("routines").insert({
    socio_id: input.socioId,
    staff_id: profile.id,
    request_id: input.requestId,
    title: input.title,
    contenido: input.contenido,
    source: input.source,
  });

  if (input.requestId) {
    await supabase
      .from("routine_requests")
      .update({ status: "completado" })
      .eq("id", input.requestId);
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
  });

  await supabase
    .from("products")
    .update({ stock: product.stock - quantity })
    .eq("id", productId);

  revalidatePath("/staff/ventas");
}

export async function updateMembership(formData: FormData) {
  const { profile, supabase } = await requireStaff();

  const socioId = String(formData.get("socio_id") ?? "");
  const planId = String(formData.get("plan_id") ?? "") || null;
  const endDate = String(formData.get("end_date") ?? "");
  const startDate = String(formData.get("start_date") ?? new Date().toISOString().slice(0, 10));

  if (!socioId || !endDate) return;

  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("socio_id", socioId)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("memberships")
      .update({ plan_id: planId, start_date: startDate, end_date: endDate, status: "activo" })
      .eq("id", existing.id);
  } else {
    await supabase.from("memberships").insert({
      socio_id: socioId,
      plan_id: planId,
      start_date: startDate,
      end_date: endDate,
      status: "activo",
      created_by: profile.id,
    });
  }

  revalidatePath("/staff/socios");
  revalidatePath("/dueno/socios");
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

  const today = new Date().toISOString().slice(0, 10);
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
