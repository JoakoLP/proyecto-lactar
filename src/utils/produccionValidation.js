const CAMPOS_PRODUCCION = new Set([
  "idTina",
  "idProducto",
  "litrosLeche",
  "observaciones",
]);

const CAMPOS_UPDATE_LOTE = new Set([
  "idEstadoLote",
  "estado",
  "kilosObtenidos",
  "observaciones",
]);

const MAXIMO_ENTERO = 2147483647;
const MAXIMO_LITROS_TINA = 5800;
const MAXIMO_KILOS = 999999.99;

export const ESTADOS_LOTE = {
  EN_PRODUCCION: 1,
  EN_MADURACION: 2,
  DISPONIBLE: 3,
  RESERVADO_PARCIAL: 4,
  RESERVADO_TOTAL: 5,
  AGOTADO: 6,
  BLOQUEADO: 7,
  CERRADO: 8,
};

export const NOMBRES_ESTADO_LOTE = {
  1: "En producción",
  2: "En maduración",
  3: "Disponible",
  4: "Reservado parcial",
  5: "Reservado total",
  6: "Agotado",
  7: "Bloqueado",
  8: "Cerrado",
};

const ID_POR_NOMBRE_ESTADO = Object.fromEntries(
  Object.entries(NOMBRES_ESTADO_LOTE).map(([id, nombre]) => [
    nombre.toLowerCase(),
    Number(id),
  ]),
);

const ESTADOS_DESTINO_PRODUCCION = new Set([
  ESTADOS_LOTE.EN_MADURACION,
  ESTADOS_LOTE.DISPONIBLE,
  ESTADOS_LOTE.BLOQUEADO,
  ESTADOS_LOTE.CERRADO,
]);

export const TRANSICIONES_ESTADO_LOTE = {
  [ESTADOS_LOTE.EN_PRODUCCION]: new Set([
    ESTADOS_LOTE.EN_MADURACION,
    ESTADOS_LOTE.DISPONIBLE,
    ESTADOS_LOTE.BLOQUEADO,
    ESTADOS_LOTE.CERRADO,
  ]),
  [ESTADOS_LOTE.EN_MADURACION]: new Set([
    ESTADOS_LOTE.DISPONIBLE,
    ESTADOS_LOTE.BLOQUEADO,
    ESTADOS_LOTE.CERRADO,
  ]),
  [ESTADOS_LOTE.DISPONIBLE]: new Set([
    ESTADOS_LOTE.BLOQUEADO,
    ESTADOS_LOTE.CERRADO,
  ]),
  [ESTADOS_LOTE.BLOQUEADO]: new Set([
    ESTADOS_LOTE.EN_MADURACION,
    ESTADOS_LOTE.DISPONIBLE,
    ESTADOS_LOTE.CERRADO,
  ]),
  [ESTADOS_LOTE.CERRADO]: new Set(),
};

function esIdentificadorValido(valor) {
  return Number.isInteger(valor) && valor > 0 && valor <= MAXIMO_ENTERO;
}

function esDecimalPositivoValido(valor, maximo) {
  return (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor > 0 &&
    valor <= maximo &&
    /^\d{1,6}(?:\.\d{1,2})?$/.test(String(valor))
  );
}

function validarObservaciones(valor) {
  if (valor === undefined || valor === null) {
    return { value: null };
  }
  if (typeof valor !== "string") {
    return { error: "Las observaciones deben ser texto." };
  }
  const limpias = valor.trim();
  if (limpias.length > 255) {
    return {
      error: "Las observaciones no pueden superar los 255 caracteres.",
    };
  }
  return { value: limpias || null };
}

export function resolveEstadoLoteId(estadoOId) {
  if (typeof estadoOId === "number") {
    return NOMBRES_ESTADO_LOTE[estadoOId] ? estadoOId : null;
  }
  if (typeof estadoOId === "string") {
    return ID_POR_NOMBRE_ESTADO[estadoOId.trim().toLowerCase()] ?? null;
  }
  return null;
}

export function isTransicionEstadoLoteValida(estadoActualId, estadoNuevoId) {
  if (estadoActualId === estadoNuevoId) return true;
  const permitidos = TRANSICIONES_ESTADO_LOTE[estadoActualId];
  return Boolean(permitidos && permitidos.has(estadoNuevoId));
}

export function validateProduccionPayload(payload, { capacidadLitros } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "El cuerpo de la solicitud debe ser un objeto JSON." };
  }

  const camposDesconocidos = Object.keys(payload).filter(
    (campo) => !CAMPOS_PRODUCCION.has(campo),
  );
  if (camposDesconocidos.length > 0) {
    return {
      error: "La solicitud contiene campos no permitidos.",
      details: camposDesconocidos,
    };
  }

  if (!esIdentificadorValido(payload.idTina)) {
    return { error: "El identificador de la tina no es válido." };
  }

  if (!esIdentificadorValido(payload.idProducto)) {
    return { error: "El identificador del producto no es válido." };
  }

  if (!esDecimalPositivoValido(payload.litrosLeche, MAXIMO_LITROS_TINA)) {
    return {
      error: `Los litros de leche deben ser mayores a 0, no superar ${MAXIMO_LITROS_TINA} L y tener hasta dos decimales.`,
    };
  }

  if (
    typeof capacidadLitros === "number" &&
    Number.isFinite(capacidadLitros) &&
    payload.litrosLeche > capacidadLitros
  ) {
    return {
      error: `Los litros de leche (${payload.litrosLeche} L) superan la capacidad máxima de la tina (${capacidadLitros} L).`,
    };
  }

  const obs = validarObservaciones(payload.observaciones);
  if (obs.error) {
    return { error: obs.error };
  }

  return {
    data: {
      idTina: payload.idTina,
      idProducto: payload.idProducto,
      litrosLeche: payload.litrosLeche,
      observaciones: obs.value,
    },
  };
}

export function validateUpdateLotePayload(payload, { loteActual } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "El cuerpo de la solicitud debe ser un objeto JSON." };
  }

  const camposPresentes = Object.keys(payload);
  if (camposPresentes.length === 0) {
    return {
      error: "Debe enviar al menos un campo para actualizar el lote.",
    };
  }

  const camposDesconocidos = camposPresentes.filter(
    (campo) => !CAMPOS_UPDATE_LOTE.has(campo),
  );
  if (camposDesconocidos.length > 0) {
    return {
      error: "La solicitud contiene campos no permitidos.",
      details: camposDesconocidos,
    };
  }

  let idEstadoLote;
  if (payload.idEstadoLote !== undefined || payload.estado !== undefined) {
    const desdeId =
      payload.idEstadoLote !== undefined
        ? resolveEstadoLoteId(payload.idEstadoLote)
        : null;
    const desdeNombre =
      payload.estado !== undefined ? resolveEstadoLoteId(payload.estado) : null;

    if (payload.idEstadoLote !== undefined && !desdeId) {
      return { error: "El estado de lote indicado no es válido." };
    }
    if (payload.estado !== undefined && !desdeNombre) {
      return { error: "El nombre de estado de lote indicado no es válido." };
    }
    if (desdeId && desdeNombre && desdeId !== desdeNombre) {
      return {
        error: "El identificador y el nombre del estado de lote no coinciden.",
      };
    }

    idEstadoLote = desdeId ?? desdeNombre;

    if (!ESTADOS_DESTINO_PRODUCCION.has(idEstadoLote)) {
      return {
        error:
          "El estado de destino no está permitido para el flujo de producción.",
      };
    }

    if (
      loteActual &&
      !isTransicionEstadoLoteValida(loteActual.idEstadoLote, idEstadoLote)
    ) {
      const nombreActual =
        NOMBRES_ESTADO_LOTE[loteActual.idEstadoLote] ?? loteActual.idEstadoLote;
      const nombreNuevo = NOMBRES_ESTADO_LOTE[idEstadoLote] ?? idEstadoLote;
      return {
        error: `No se permite cambiar el lote del estado "${nombreActual}" a "${nombreNuevo}".`,
      };
    }
  }

  let kilosObtenidos;
  if (payload.kilosObtenidos !== undefined && payload.kilosObtenidos !== null) {
    if (!esDecimalPositivoValido(payload.kilosObtenidos, MAXIMO_KILOS)) {
      return {
        error:
          "Los kilos obtenidos deben ser un número finito mayor a 0 con hasta dos decimales.",
      };
    }
    kilosObtenidos = payload.kilosObtenidos;
  }

  if (idEstadoLote === ESTADOS_LOTE.CERRADO) {
    const kilosPrevios = Number(loteActual?.kilosObtenidos ?? 0);
    const tieneKilosValidos =
      kilosObtenidos !== undefined || (loteActual && kilosPrevios > 0);
    if (!tieneKilosValidos) {
      return {
        error:
          "Para cerrar el lote debe informar kilosObtenidos mayores a 0.",
      };
    }
  }

  let observaciones;
  if (payload.observaciones !== undefined) {
    const obs = validarObservaciones(payload.observaciones);
    if (obs.error) {
      return { error: obs.error };
    }
    observaciones = obs.value;
  }

  return {
    data: {
      ...(idEstadoLote !== undefined ? { idEstadoLote } : {}),
      ...(kilosObtenidos !== undefined ? { kilosObtenidos } : {}),
      ...(observaciones !== undefined ? { observaciones } : {}),
    },
  };
}
