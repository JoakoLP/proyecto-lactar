import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { ALL_ROLES } from "@/utils/permissions";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await requireAuth(request, { roles: ALL_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { data, error } = await supabase
      .from("producto")
      .select("idProducto,nombre,precioBase")
      .order("nombre", { ascending: true });

    if (error) {
      return apiError("Error al consultar los productos", 500, error.message);
    }

    return apiSuccess(data ?? [], "Productos obtenidos correctamente");
  } catch (error) {
    return apiError("Error interno al consultar los productos", 500, error.message);
  }
}
