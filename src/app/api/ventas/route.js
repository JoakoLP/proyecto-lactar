import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { ROLES } from "@/utils/permissions";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await requireAuth(request, { roles: [ROLES.ADMIN, ROLES.VENDEDOR] });
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { data, error } = await supabase
      .from("venta")
      .select(
        `
          idVenta,
          fechaVenta,
          numeroFactura,
          total,
          idPedido,
          pedido(
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
          ),
          cobranza(
            idCobranza,
            fecha,
            monto,
            observaciones,
            medio_pago(idMedioPago, nombre),
            estado_cobranza(idEstadoCobranza, nombre)
          )
        `,
      )
      .order("fechaVenta", { ascending: false })
      .order("idVenta", { ascending: false });

    if (error) {
      return apiError("Error al consultar las ventas", 500, error.message);
    }

    return apiSuccess(data ?? [], "Ventas obtenidas correctamente");
  } catch (error) {
    return apiError("Error interno al consultar las ventas", 500, error.message);
  }
}
