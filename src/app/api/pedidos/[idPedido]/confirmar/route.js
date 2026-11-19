import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { ROLES } from "@/utils/permissions";

export const dynamic = "force-dynamic";

const PEDIDOS_ROLES = [ROLES.ADMIN, ROLES.VENDEDOR];

function parsePedidoId(valor) {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) return null;

  const idPedido = Number(valor);
  return Number.isSafeInteger(idPedido) && idPedido > 0 ? idPedido : null;
}

export async function POST(request, context) {
  const auth = await requireAuth(request, { roles: PEDIDOS_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  const { idPedido: valorIdPedido } = await context.params;
  const idPedido = parsePedidoId(valorIdPedido);
  if (!idPedido) {
    return apiError("El identificador del pedido no es válido.", 400);
  }

  try {
    const { data, error } = await supabase.rpc(
      "confirmar_venta_pedido_transaccional",
      { p_id_pedido: idPedido },
    );

    if (error) {
      const estadoPorCodigo = {
        P3001: 404,
        P3002: 409,
        P3003: 500,
        P3004: 409,
        P3005: 409,
        P3006: 500,
      };
      return apiError(
        error.message || "No se pudo confirmar la venta.",
        estadoPorCodigo[error.code] ?? 500,
        estadoPorCodigo[error.code] ? null : error.code,
      );
    }

    return apiSuccess(
      data,
      "Venta confirmada y stock descontado correctamente.",
      201,
    );
  } catch (error) {
    return apiError("Error interno al confirmar la venta.", 500, error.message);
  }
}
