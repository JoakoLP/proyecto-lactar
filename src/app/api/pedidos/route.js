import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { validatePedidoPayload } from "@/utils/pedidoValidation";
import { ROLES } from "@/utils/permissions";

export const dynamic = "force-dynamic";

const PEDIDOS_ROLES = [ROLES.ADMIN, ROLES.VENDEDOR];

export async function GET(request) {
  const auth = await requireAuth(request, { roles: PEDIDOS_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { data, error } = await supabase
      .from("pedido")
      .select(
        `
          idPedido,
          fecha,
          observaciones,
          cliente(idCliente, razonSocial),
          estado_pedido(idEstadoPedido, nombre),
          detalle_pedido(
            nroItem,
            cantidadPiezas,
            kilosSolicitados,
            precioKg,
            subtotal,
            producto(idProducto, nombre),
            asignacion_lote(idAsignacion, codigoLote, kilosAsignados)
          )
        `,
      )
      .order("fecha", { ascending: false })
      .order("idPedido", { ascending: false });

    if (error) {
      return apiError("Error al consultar los pedidos", 500, error.message);
    }

    return apiSuccess(data ?? [], "Pedidos obtenidos correctamente");
  } catch (error) {
    return apiError("Error interno al consultar los pedidos", 500, error.message);
  }
}

export async function POST(request) {
  const auth = await requireAuth(request, { roles: PEDIDOS_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError("El cuerpo de la solicitud debe ser JSON válido.", 400);
  }

  const validacion = validatePedidoPayload(payload);
  if (validacion.error) {
    return apiError(validacion.error, 400, validacion.details ?? null);
  }

  try {
    const { data, error } = await supabase.rpc("crear_pedido_transaccional", {
      p_id_cliente: validacion.data.idCliente,
      p_observaciones: validacion.data.observaciones,
      p_detalles: validacion.data.detalles,
    });

    if (error) {
      const estadoPorCodigo = {
        P1001: 400,
        P1002: 400,
        P1003: 409,
        P1004: 400,
        P1005: 500,
      };
      return apiError(
        error.message || "No se pudo registrar el pedido.",
        estadoPorCodigo[error.code] ?? 500,
        estadoPorCodigo[error.code] ? null : error.code,
      );
    }

    return apiSuccess(data, "Pedido registrado y stock reservado correctamente.", 201);
  } catch (error) {
    return apiError("Error interno al registrar el pedido.", 500, error.message);
  }
}
