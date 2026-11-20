import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { ROLES } from "@/utils/permissions";

export const dynamic = "force-dynamic";

const LOTES_ROLES = [ROLES.ADMIN, ROLES.OPERARIO];

export async function GET(request) {
  const auth = await requireAuth(request, { roles: LOTES_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { data, error } = await supabase
      .from("lote")
      .select(
        `
          codigoLote,
          litrosLeche,
          kilosObtenidos,
          kilosDisponibles,
          rendimientoReal,
          fechaInicio,
          fechaFin,
          observaciones,
          idProducto,
          idTina,
          idUsuario,
          idEstadoLote,
          producto(idProducto, nombre, rendimientoEsperado, tiempoMaduracion),
          tina(idTina, capacidadLitros),
          usuario(idUsuario, nombre, apellido),
          estado_lote(idEstadoLote, nombre)
        `,
      )
      .order("fechaInicio", { ascending: false })
      .order("codigoLote", { ascending: false });

    if (error) {
      return apiError("Error al consultar los lotes", 500, error.message);
    }

    return apiSuccess(data ?? [], "Lotes obtenidos correctamente");
  } catch (error) {
    return apiError("Error interno al consultar los lotes", 500, error.message);
  }
}
