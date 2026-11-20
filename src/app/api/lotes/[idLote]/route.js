import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { ROLES } from "@/utils/permissions";
import {
  ESTADOS_LOTE,
  validateUpdateLotePayload,
} from "@/utils/produccionValidation";

export const dynamic = "force-dynamic";

const LOTES_ROLES = [ROLES.ADMIN, ROLES.OPERARIO];

const SELECT_LOTE_DETALLE = `
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
  estado_lote(idEstadoLote, nombre),
  asignacion_lote(
    idAsignacion,
    idPedido,
    nroItem,
    kilosAsignados,
    detalle_pedido(
      nroItem,
      pedido(
        idPedido,
        fecha,
        cliente(idCliente, razonSocial)
      )
    )
  )
`;

const SELECT_LOTE_ACTUALIZADO = `
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
`;

async function getCodigoLote(context) {
  const { idLote } = await context.params;
  if (typeof idLote !== "string") return null;

  const codigo = decodeURIComponent(idLote).trim();
  if (!codigo || codigo.length > 20) return null;

  return codigo;
}

function normalizarDetalleLote(row) {
  if (!row) return null;
  return {
    ...row,
    asignacion_lote: (row.asignacion_lote ?? []).map((item) => ({
      idAsignacion: item.idAsignacion,
      idPedido: item.idPedido,
      nroItem: item.nroItem,
      kilosAsignados: item.kilosAsignados,
      pedido: item.detalle_pedido?.pedido ?? null,
    })),
  };
}

export async function GET(request, context) {
  const auth = await requireAuth(request, { roles: LOTES_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  const codigoLote = await getCodigoLote(context);
  if (!codigoLote) {
    return apiError("El código de lote no es válido.", 400);
  }

  try {
    const { data, error } = await supabase
      .from("lote")
      .select(SELECT_LOTE_DETALLE)
      .eq("codigoLote", codigoLote)
      .maybeSingle();

    if (error) {
      return apiError("Error al consultar el lote", 500, error.message);
    }
    if (!data) {
      return apiError("No se encontró el lote solicitado.", 404);
    }

    return apiSuccess(
      normalizarDetalleLote(data),
      "Detalle de lote obtenido correctamente",
    );
  } catch (error) {
    return apiError("Error interno al consultar el lote", 500, error.message);
  }
}

export async function PATCH(request, context) {
  const auth = await requireAuth(request, { roles: LOTES_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  const codigoLote = await getCodigoLote(context);
  if (!codigoLote) {
    return apiError("El código de lote no es válido.", 400);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError("El cuerpo de la solicitud debe ser JSON válido.", 400);
  }

  try {
    const { data: loteActual, error: loteError } = await supabase
      .from("lote")
      .select(
        "codigoLote, litrosLeche, kilosObtenidos, kilosDisponibles, fechaFin, idEstadoLote",
      )
      .eq("codigoLote", codigoLote)
      .maybeSingle();

    if (loteError) {
      return apiError(
        "Error al consultar el lote actual",
        500,
        loteError.message,
      );
    }
    if (!loteActual) {
      return apiError("No se encontró el lote solicitado.", 404);
    }

    const validacion = validateUpdateLotePayload(payload, { loteActual });
    if (validacion.error) {
      return apiError(validacion.error, 400, validacion.details ?? null);
    }

    const cambios = { ...validacion.data };

    if (cambios.kilosObtenidos !== undefined) {
      const litrosLeche = Number(loteActual.litrosLeche);
      if (!Number.isFinite(litrosLeche) || litrosLeche <= 0) {
        return apiError(
          "Los litros de leche del lote no permiten calcular el rendimiento.",
          400,
        );
      }

      cambios.rendimientoReal = Number(
        ((cambios.kilosObtenidos / litrosLeche) * 100).toFixed(2),
      );

      const { data: asignaciones, error: asignacionesError } = await supabase
        .from("asignacion_lote")
        .select("kilosAsignados")
        .eq("codigoLote", codigoLote);

      if (asignacionesError) {
        return apiError(
          "Error al verificar las reservas del lote",
          500,
          asignacionesError.message,
        );
      }

      const kilosReservados = (asignaciones ?? []).reduce(
        (acum, item) => acum + Number(item.kilosAsignados ?? 0),
        0,
      );

      if (kilosReservados === 0) {
        cambios.kilosDisponibles = cambios.kilosObtenidos;
      } else {
        cambios.kilosDisponibles = Math.max(
          0,
          Number((cambios.kilosObtenidos - kilosReservados).toFixed(2)),
        );
      }
    }

    const estadoFinal = cambios.idEstadoLote ?? loteActual.idEstadoLote;
    const correspondeFechaFin =
      !loteActual.fechaFin &&
      (estadoFinal === ESTADOS_LOTE.CERRADO ||
        estadoFinal === ESTADOS_LOTE.DISPONIBLE ||
        estadoFinal === ESTADOS_LOTE.EN_MADURACION ||
        cambios.kilosObtenidos !== undefined);

    if (correspondeFechaFin) {
      cambios.fechaFin = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("lote")
      .update(cambios)
      .eq("codigoLote", codigoLote)
      .select(SELECT_LOTE_ACTUALIZADO)
      .maybeSingle();

    if (error) {
      return apiError("No se pudo actualizar el lote", 500, error.message);
    }
    if (!data) {
      return apiError("No se encontró el lote solicitado.", 404);
    }

    return apiSuccess(data, "Lote actualizado correctamente");
  } catch (error) {
    return apiError("Error interno al actualizar el lote", 500, error.message);
  }
}
