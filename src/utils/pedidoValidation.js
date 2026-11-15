const CAMPOS_PEDIDO = new Set(["idCliente", "observaciones", "detalles"]);
const CAMPOS_DETALLE = new Set([
  "idProducto",
  "cantidadPiezas",
  "kilosSolicitados",
]);
const MAXIMO_ENTERO = 2147483647;

function esIdentificadorValido(valor) {
  return (
    Number.isInteger(valor) &&
    valor > 0 &&
    valor <= MAXIMO_ENTERO
  );
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

export function validatePedidoPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "El cuerpo de la solicitud debe ser un objeto JSON." };
  }

  const camposDesconocidos = Object.keys(payload).filter(
    (campo) => !CAMPOS_PEDIDO.has(campo),
  );
  if (camposDesconocidos.length > 0) {
    return {
      error: "La solicitud contiene campos no permitidos.",
      details: camposDesconocidos,
    };
  }

  if (!esIdentificadorValido(payload.idCliente)) {
    return { error: "El identificador del cliente no es válido." };
  }

  let observaciones = null;
  if (payload.observaciones !== undefined && payload.observaciones !== null) {
    if (typeof payload.observaciones !== "string") {
      return { error: "Las observaciones deben ser texto." };
    }
    observaciones = payload.observaciones.trim() || null;
    if (observaciones?.length > 200) {
      return { error: "Las observaciones no pueden superar los 200 caracteres." };
    }
  }

  if (!Array.isArray(payload.detalles) || payload.detalles.length === 0) {
    return { error: "El pedido debe incluir al menos un detalle." };
  }
  if (payload.detalles.length > 100) {
    return { error: "El pedido no puede incluir más de 100 detalles." };
  }

  const detalles = [];
  for (const [indice, detalle] of payload.detalles.entries()) {
    if (!detalle || typeof detalle !== "object" || Array.isArray(detalle)) {
      return {
        error: `El detalle ${indice + 1} debe ser un objeto.`,
      };
    }

    const camposDesconocidosDetalle = Object.keys(detalle).filter(
      (campo) => !CAMPOS_DETALLE.has(campo),
    );
    if (camposDesconocidosDetalle.length > 0) {
      return {
        error: `El detalle ${indice + 1} contiene campos no permitidos.`,
        details: camposDesconocidosDetalle,
      };
    }

    if (!esIdentificadorValido(detalle.idProducto)) {
      return {
        error: `El producto del detalle ${indice + 1} no es válido.`,
      };
    }
    if (!esIdentificadorValido(detalle.cantidadPiezas)) {
      return {
        error: `La cantidad de piezas del detalle ${indice + 1} debe ser un entero positivo.`,
      };
    }
    if (!esDecimalPositivoValido(detalle.kilosSolicitados, 999999.99)) {
      return {
        error: `Los kilos del detalle ${indice + 1} deben ser mayores a 0 y tener hasta dos decimales.`,
      };
    }

    detalles.push({
      idProducto: detalle.idProducto,
      cantidadPiezas: detalle.cantidadPiezas,
      kilosSolicitados: detalle.kilosSolicitados,
    });
  }

  return {
    data: {
      idCliente: payload.idCliente,
      observaciones,
      detalles,
    },
  };
}
