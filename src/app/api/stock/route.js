import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { ALL_ROLES } from "@/utils/permissions";

export const dynamic = "force-dynamic";

const ESTADOS_LOTE_VENDIBLES = [
  "Disponible",
  "Reservado parcial",
  "Reservado total",
];
const ESTADOS_PEDIDO_CON_RESERVA = [
  "Pendiente",
  "En preparación",
  "Preparado",
];

export async function GET(request) {
  const auth = await requireAuth(request, { roles: ALL_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const [respuestaLotes, respuestaAsignaciones] = await Promise.all([
      supabase
        .from("lote")
        .select(
          "codigoLote,kilosDisponibles,fechaInicio,producto!inner(idProducto,nombre),estado_lote!inner(nombre)",
        )
        .order("fechaInicio", { ascending: true })
        .order("codigoLote", { ascending: true }),
      supabase
        .from("asignacion_lote")
        .select(
          "codigoLote,kilosAsignados,detalle_pedido!inner(pedido!inner(estado_pedido!inner(nombre)))",
        ),
    ]);

    if (respuestaLotes.error) {
      return apiError(
        "Error al consultar los lotes para el stock",
        500,
        respuestaLotes.error.message,
      );
    }

    if (respuestaAsignaciones.error) {
      return apiError(
        "Error al consultar las reservas del stock",
        500,
        respuestaAsignaciones.error.message,
      );
    }

    const reservasPorLote = new Map();
    for (const asignacion of respuestaAsignaciones.data ?? []) {
      const estadoPedido =
        asignacion.detalle_pedido?.pedido?.estado_pedido?.nombre;
      if (!ESTADOS_PEDIDO_CON_RESERVA.includes(estadoPedido)) continue;

      const kilosAsignados = Number(asignacion.kilosAsignados);
      if (!Number.isFinite(kilosAsignados) || kilosAsignados < 0) {
        return apiError(
          "Se encontró una reserva con kilos inválidos",
          500,
          { codigoLote: asignacion.codigoLote },
        );
      }

      reservasPorLote.set(
        asignacion.codigoLote,
        (reservasPorLote.get(asignacion.codigoLote) ?? 0) + kilosAsignados,
      );
    }

    const lotes = [];
    for (const lote of respuestaLotes.data ?? []) {
      if (!ESTADOS_LOTE_VENDIBLES.includes(lote.estado_lote?.nombre)) {
        continue;
      }

      const kilosDisponibles = Number(lote.kilosDisponibles ?? 0);
      const kilosReservados = reservasPorLote.get(lote.codigoLote) ?? 0;

      if (!Number.isFinite(kilosDisponibles) || kilosDisponibles < 0) {
        return apiError(
          "Se encontró un lote con kilos disponibles inválidos",
          500,
          { codigoLote: lote.codigoLote },
        );
      }
      if (kilosReservados > kilosDisponibles) {
        return apiError(
          "Las reservas superan los kilos disponibles del lote",
          500,
          {
            codigoLote: lote.codigoLote,
            kilosDisponibles,
            kilosReservados,
          },
        );
      }

      lotes.push({
        codigoLote: lote.codigoLote,
        producto: lote.producto.nombre,
        estado: lote.estado_lote.nombre,
        fechaInicio: lote.fechaInicio,
        kilosDisponibles,
        kilosReservados,
        stockDisponible: kilosDisponibles - kilosReservados,
      });
    }

    return apiSuccess(lotes, "Stock obtenido correctamente");
  } catch (error) {
    return apiError("Error interno al consultar el stock", 500, error.message);
  }
}
