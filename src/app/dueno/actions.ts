"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireDueno() {
  const { profile, supabase } = await requireProfile();
  if (profile.role !== "dueno") throw new Error("No autorizado");
  return { profile, supabase };
}

// --- Planes -----------------------------------------------------------------

export async function upsertPlan(formData: FormData) {
  const { supabase } = await requireDueno();
  const id = String(formData.get("id") ?? "");
  const payload = {
    name: String(formData.get("name") ?? ""),
    price: Number(formData.get("price") ?? 0),
    duration_days: Number(formData.get("duration_days") ?? 30),
    description: String(formData.get("description") ?? ""),
  };
  if (id) {
    await supabase.from("membership_plans").update(payload).eq("id", id);
  } else {
    await supabase.from("membership_plans").insert(payload);
  }
  revalidatePath("/dueno/planes");
  revalidatePath("/");
}

export async function deletePlan(formData: FormData) {
  const { supabase } = await requireDueno();
  const id = String(formData.get("id") ?? "");
  await supabase.from("membership_plans").delete().eq("id", id);
  revalidatePath("/dueno/planes");
  revalidatePath("/");
}

// --- Clases -------------------------------------------------------------------

export async function upsertClass(formData: FormData) {
  const { supabase } = await requireDueno();
  const id = String(formData.get("id") ?? "");
  const payload = {
    name: String(formData.get("name") ?? ""),
    schedule: String(formData.get("schedule") ?? ""),
    capacity: Number(formData.get("capacity") ?? 0) || null,
    description: String(formData.get("description") ?? ""),
  };
  if (id) {
    await supabase.from("classes").update(payload).eq("id", id);
  } else {
    await supabase.from("classes").insert(payload);
  }
  revalidatePath("/dueno/clases");
  revalidatePath("/");
}

export async function deleteClass(formData: FormData) {
  const { supabase } = await requireDueno();
  const id = String(formData.get("id") ?? "");
  await supabase.from("classes").delete().eq("id", id);
  revalidatePath("/dueno/clases");
  revalidatePath("/");
}

// --- Productos ------------------------------------------------------------------

export async function upsertProduct(formData: FormData) {
  const { supabase } = await requireDueno();
  const id = String(formData.get("id") ?? "");

  let imageUrl = String(formData.get("existing_image_url") ?? "") || null;

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type || undefined });

    if (!uploadError) {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }
  }

  const payload = {
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    price: Number(formData.get("price") ?? 0),
    stock: Number(formData.get("stock") ?? 0),
    description: String(formData.get("description") ?? ""),
    image_url: imageUrl,
  };
  if (id) {
    await supabase.from("products").update(payload).eq("id", id);
  } else {
    await supabase.from("products").insert(payload);
  }
  revalidatePath("/dueno/tienda");
  revalidatePath("/socio/tienda");
}

export async function deleteProduct(formData: FormData) {
  const { supabase } = await requireDueno();
  const id = String(formData.get("id") ?? "");
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/dueno/tienda");
  revalidatePath("/socio/tienda");
}

// --- Contenido de landing (gym_info) --------------------------------------------

export async function upsertGymInfo(formData: FormData) {
  const { supabase } = await requireDueno();
  const entries: { key: string; value: string }[] = [
    { key: "nombre_gimnasio", value: String(formData.get("nombre_gimnasio") ?? "") },
    { key: "texto_bienvenida", value: String(formData.get("texto_bienvenida") ?? "") },
    { key: "horario_general", value: String(formData.get("horario_general") ?? "") },
    { key: "contacto_telefono", value: String(formData.get("contacto_telefono") ?? "") },
    { key: "contacto_direccion", value: String(formData.get("contacto_direccion") ?? "") },
  ];
  await supabase.from("gym_info").upsert(entries);
  revalidatePath("/dueno/contenido");
  revalidatePath("/");
}

// --- Staff -----------------------------------------------------------------------

export type CreateStaffState = { error: string | null; success?: boolean };

export async function createStaffAccount(
  _prev: CreateStaffState,
  formData: FormData
): Promise<CreateStaffState> {
  await requireDueno();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "No se pudo crear la cuenta." };
  }

  await admin.from("profiles").update({ role: "staff", full_name: fullName }).eq("id", data.user.id);

  revalidatePath("/dueno/staff");
  return { error: null, success: true };
}

export async function removeStaff(formData: FormData) {
  const { supabase } = await requireDueno();
  const id = String(formData.get("id") ?? "");
  await supabase.from("profiles").update({ role: "socio" }).eq("id", id);
  revalidatePath("/dueno/staff");
}

export async function deleteSocio(formData: FormData) {
  await requireDueno();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id);

  revalidatePath("/staff/socios");
  revalidatePath("/dueno");
}
