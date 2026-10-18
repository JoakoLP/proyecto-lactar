import { supabase } from "@/services/supabase";
import { apiSuccess, apiError } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET() {
  const urlConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const keyConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const configStatus = {
    envVariables: {
      NEXT_PUBLIC_SUPABASE_URL: urlConfigured ? "Configurada" : "Faltante",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: keyConfigured ? "Configurada" : "Faltante",
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
        ? "Configurada"
        : "No requerida / Opcional",
    },
    timestamp: new Date().toISOString(),
  };

  if (!urlConfigured || !keyConfigured) {
    return apiError(
      "Variables de entorno de Supabase no configuradas. Verifica .env.local",
      500,
      configStatus
    );
  }

  try {
    // Intentar consultar una tabla base del sistema para comprobar conectividad
    const { data, error } = await supabase.from("rol").select("idRol, nombre").limit(5);

    if (error) {
      return apiSuccess(
        {
          ...configStatus,
          dbConnection: "reachable_with_notice",
          dbNotice: error.message,
        },
        "Servidor activo y conectado a Supabase (aviso: la tabla 'rol' puede no haber sido creada aún en Supabase)",
        200
      );
    }

    return apiSuccess(
      {
        ...configStatus,
        dbConnection: "connected",
        rolesRegistrados: data,
      },
      "Backend y conexión a la base de datos funcionando correctamente",
      200
    );
  } catch (err) {
    return apiError("Fallo inesperado al conectar con Supabase", 500, {
      ...configStatus,
      message: err.message,
    });
  }
}
