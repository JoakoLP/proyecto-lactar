import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { ROLES } from "@/utils/permissions";

export const dynamic = "force-dynamic";

const ESTADOS_PERMITIDOS = ["En preparación", "Preparado", "Cancelado"];
const PEDIDOS_ROLES = [ROLES.ADMIN, ROLES.VENDEDOR];

function parsePedidoId(valor) {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) return null;

  const idPedido = Number(valor);
  return Number.isSafeInteger(idPedido) && idPedido > 0 ? idPedido : null;
}

export async function PATCH(request, context) {
  const auth = await requireAuth(request, { roles: PEDIDOS_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  const { idPedido: valorIdPedido } = await context.params;
  const idPedido = parsePedidoId(valorIdPedido);
  if (!idPedido) {
    return apiError("El identificador del pedido no es válido.", 400);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError("El cuerpo de la solicitud debe ser JSON válido.", 400);
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    Object.keys(payload).some((campo) => campo !== "estado")
  ) {
    return apiError("El cuerpo debe contener únicamente el nuevo estado.", 400);
  }
  if (!ESTADOS_PERMITIDOS.includes(payload.estado)) {
    return apiError("El nuevo estado del pedido no es válido.", 400);
  }

  try {
    const { data, error } = await supabase.rpc(
      "cambiar_estado_pedido_transaccional",
      {
        p_id_pedido: idPedido,
        p_estado: payload.estado,
      },
    );

    if (error) {
      const estadoPorCodigo = {
        P2001: 404,
        P2002: 409,
        P2003: 400,
        P2004: 500,
      };
      return apiError(
        error.message || "No se pudo actualizar el estado del pedido.",
        estadoPorCodigo[error.code] ?? 500,
        estadoPorCodigo[error.code] ? null : error.code,
      );
    }

    return apiSuccess(data, "Estado del pedido actualizado correctamente.");
  } catch (error) {
    return apiError(
      "Error interno al actualizar el estado del pedido.",
      500,
      error.message,
    );
  }
}
