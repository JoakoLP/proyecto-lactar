import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "⚠️ [Supabase Warning]: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están definidas. Revisa tu archivo .env.local"
    );
  }
}

/**
 * Cliente de Supabase estándar para uso en Frontend y Route Handlers generales.
 */
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

/**
 * Cliente con privilegios de servicio (Service Role Key) para Route Handlers de backend
 * que requieran bypass de políticas RLS o tareas administrativas del servidor.
 * Solo debe utilizarse en el entorno del servidor (app/api).
 */
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Faltan variables de entorno para inicializar el cliente de Supabase en el servidor."
    );
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default supabase;
