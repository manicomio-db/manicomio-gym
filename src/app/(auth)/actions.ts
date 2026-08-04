"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthState = { error: string | null };

const USERNAME_DOMAIN = "manicomio.local";

function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

function usernameToEmail(username: string) {
  return `${username}@${USERNAME_DOMAIN}`;
}

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const email = identifier.includes("@")
    ? identifier
    : usernameToEmail(normalizeUsername(identifier));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        error: "Tu cuenta aún no está confirmada. Pide ayuda a tu instructor.",
      };
    }
    return { error: "Usuario/correo o contraseña incorrectos." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const role = profile?.role ?? "socio";
  redirect(role === "dueno" ? "/dueno" : role === "staff" ? "/staff" : "/socio");
}

export async function signup(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const phone = String(formData.get("phone") ?? "");

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return {
      error: "El usuario debe tener entre 3 y 30 caracteres (letras, números, punto o guion, sin espacios).",
    };
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();

  const { data: available } = await supabase.rpc("username_available", {
    check_username: username,
  });

  if (available === false) {
    return { error: "Ese nombre de usuario ya está en uso. Elige otro." };
  }

  const { data, error } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password,
    options: { data: { full_name: fullName, phone, username } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Ese nombre de usuario ya está en uso. Elige otro." };
    }
    return { error: error.message };
  }

  if (!data.session) {
    redirect("/login?confirm=1");
  }

  redirect("/socio");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
