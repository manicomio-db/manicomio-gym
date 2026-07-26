import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con service_role — SOLO usar en código de servidor (Server Actions / Route
// Handlers), nunca importar desde un componente cliente. Se usa exclusivamente para
// crear cuentas de staff, que no pueden autoregistrarse.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
