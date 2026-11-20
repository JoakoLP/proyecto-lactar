import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { ROLES } from "@/utils/permissions";

export const dynamic = "force-dynamic";

const PRODUCCION_ROLES = [ROLES.ADMIN, ROLES.OPERARIO];

export async function GET(request) {
  const auth = await requireAuth(request, { roles: PRODUCCION_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { data, error } = await supabase
      .from("tina")
      .select("idTina, capacidadLitros")
      .order("idTina", { ascending: true });

    if (error) {
      return apiError("Error al consultar las tinas", 500, error.message);
    }

    return apiSuccess(data ?? [], "Tinas obtenidas correctamente");
  } catch (error) {
    return apiError("Error interno al consultar las tinas", 500, error.message);
  }
}
