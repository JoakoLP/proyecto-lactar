import crypto from "crypto";
import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { ROLES } from "@/utils/permissions";
import {
  ESTADOS_LOTE,
  validateProduccionPayload,
} from "@/utils/produccionValidation";

export const dynamic = "force-dynamic";

const PRODUCCION_ROLES = [ROLES.ADMIN, ROLES.OPERARIO];

const SELECT_LOTE_RELACIONES = `
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

function generarCodigoLote() {
  const ahora = new Date();
  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, "0");
  const dd = String(ahora.getDate()).padStart(2, "0");
  const sufijo = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `L-${yyyy}${mm}${dd}-${sufijo}`;
}

export async function GET(request) {
  const auth = await requireAuth(request, { roles: PRODUCCION_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { data, error } = await supabase
      .from("lote")
      .select(SELECT_LOTE_RELACIONES)
      .order("fechaInicio", { ascending: false })
      .order("codigoLote", { ascending: false });

    if (error) {
      return apiError(
        "Error al consultar las producciones",
        500,
        error.message,
      );
    }

    return apiSuccess(data ?? [], "Producciones obtenidas correctamente");
  } catch (error) {
    return apiError(
      "Error interno al consultar las producciones",
      500,
      error.message,
    );
  }
}

export async function POST(request) {
  const auth = await requireAuth(request, { roles: PRODUCCION_ROLES });
  if (auth.errorResponse) return auth.errorResponse;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError("El cuerpo de la solicitud debe ser JSON válido.", 400);
  }

  const validacionBase = validateProduccionPayload(payload);
  if (validacionBase.error) {
    return apiError(
      validacionBase.error,
      400,
      validacionBase.details ?? null,
    );
  }

  const { idTina, idProducto, litrosLeche, observaciones } = validacionBase.data;

  try {
    const { data: tina, error: tinaError } = await supabase
      .from("tina")
      .select("idTina, capacidadLitros")
      .eq("idTina", idTina)
      .maybeSingle();

    if (tinaError) {
      return apiError("Error al verificar la tina", 500, tinaError.message);
    }
    if (!tina) {
      return apiError("La tina seleccionada no existe.", 404);
    }

    const validacionCapacidad = validateProduccionPayload(payload, {
      capacidadLitros: Number(tina.capacidadLitros),
    });
    if (validacionCapacidad.error) {
      return apiError(validacionCapacidad.error, 400);
    }

    const { data: producto, error: productoError } = await supabase
      .from("producto")
      .select("idProducto")
      .eq("idProducto", idProducto)
      .maybeSingle();

    if (productoError) {
      return apiError(
        "Error al verificar el producto",
        500,
        productoError.message,
      );
    }
    if (!producto) {
      return apiError("El producto seleccionado no existe.", 404);
    }

    let loteCreado = null;
    let ultimoError = null;

    for (let intento = 0; intento < 3; intento += 1) {
      const codigoLote = generarCodigoLote();
      const { data, error } = await supabase
        .from("lote")
        .insert([
          {
            codigoLote,
            litrosLeche,
            kilosObtenidos: 0,
            kilosDisponibles: 0,
            rendimientoReal: 0,
            observaciones,
            idProducto,
            idTina,
            idUsuario: auth.user.idUsuario,
            idEstadoLote: ESTADOS_LOTE.EN_PRODUCCION,
          },
        ])
        .select(SELECT_LOTE_RELACIONES)
        .single();

      if (!error) {
        loteCreado = data;
        break;
      }

      ultimoError = error;
      if (error.code !== "23505") {
        break;
      }
    }

    if (!loteCreado) {
      return apiError(
        "No se pudo iniciar la producción.",
        400,
        ultimoError?.message ?? null,
      );
    }

    return apiSuccess(loteCreado, "Producción iniciada correctamente.", 201);
  } catch (error) {
    return apiError(
      "Error interno al iniciar la producción.",
      500,
      error.message,
    );
  }
}
