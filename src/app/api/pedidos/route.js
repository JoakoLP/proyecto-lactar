import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET() {
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
