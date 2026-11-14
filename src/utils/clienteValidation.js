const editableFields = new Set([
  "razonSocial",
  "cuit",
  "domicilio",
  "telefono",
  "email",
  "activo",
]);

export function validateClientePayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "El cuerpo de la solicitud debe ser un objeto JSON." };
  }

  const unknownFields = Object.keys(payload).filter(
    (field) => !editableFields.has(field)
  );
  if (unknownFields.length > 0) {
    return {
      error: "La solicitud contiene campos no permitidos.",
      details: unknownFields,
    };
  }

  if (partial && Object.keys(payload).length === 0) {
    return { error: "Debe enviar al menos un campo para actualizar." };
  }

  const cliente = {};
  const fields = partial
    ? Object.keys(payload)
    : ["razonSocial", "cuit", "domicilio", "telefono", "email", "activo"];

  for (const field of fields) {
    if (!(field in payload)) {
      if (partial) continue;
      if (field === "activo") {
        cliente.activo = 1;
        continue;
      }
      if (field === "domicilio" || field === "telefono" || field === "email") {
        cliente[field] = null;
        continue;
      }
      return { error: `El campo ${field} es obligatorio.` };
    }

    const value = payload[field];

    if (field === "razonSocial") {
      if (typeof value !== "string" || !value.trim()) {
        return { error: "La razón social es obligatoria." };
      }
      cliente.razonSocial = value.trim();
      if (cliente.razonSocial.length > 100) {
        return { error: "La razón social no puede superar los 100 caracteres." };
      }
      continue;
    }

    if (field === "cuit") {
      if (typeof value !== "string" || !/^\d{11}$/.test(value.trim())) {
        return { error: "El CUIT debe contener exactamente 11 números." };
      }
      cliente.cuit = value.trim();
      continue;
    }

    if (field === "telefono") {
      if (value === null || value === "") {
        cliente.telefono = null;
        continue;
      }
      if (
        typeof value !== "string" ||
        !/^\d{1,20}$/.test(value.trim())
      ) {
        return { error: "El teléfono debe contener solo números y hasta 20 dígitos." };
      }
      cliente.telefono = value.trim();
      continue;
    }

    if (field === "domicilio") {
      if (value === null || value === "") {
        cliente.domicilio = null;
        continue;
      }
      if (typeof value !== "string" || value.trim().length > 120) {
        return { error: "El domicilio debe ser texto de hasta 120 caracteres." };
      }
      cliente.domicilio = value.trim();
      continue;
    }

    if (field === "email") {
      if (value === null || value === "") {
        cliente.email = null;
        continue;
      }
      if (
        typeof value !== "string" ||
        value.trim().length > 100 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
      ) {
        return { error: "El correo electrónico no es válido." };
      }
      cliente.email = value.trim();
      continue;
    }

    if (field === "activo") {
      if (value !== 0 && value !== 1) {
        return { error: "El estado activo debe ser 0 o 1." };
      }
      cliente.activo = value;
    }
  }

  return { data: cliente };
}
