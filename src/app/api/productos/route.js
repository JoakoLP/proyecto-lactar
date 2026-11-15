import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET() {
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
