const EDITABLE_FIELDS = new Set([
  "nombre",
  "apellido",
  "nombreUsuario",
  "email",
  "password",
  "rol",
  "activo",
]);

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseActivo(value) {
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  return null;
}

export function validateUsuarioPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "El cuerpo de la solicitud debe ser un objeto JSON." };
  }

  const unknownFields = Object.keys(payload).filter(
    (field) => !EDITABLE_FIELDS.has(field)
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

  const usuario = {};
  const fields = partial
    ? Object.keys(payload)
    : ["nombre", "apellido", "nombreUsuario", "email", "password", "rol", "activo"];

  for (const field of fields) {
    if (!(field in payload)) {
      if (partial) continue;
      if (field === "activo") {
        usuario.activo = 1;
        continue;
      }
      return { error: `El campo ${field} es obligatorio.` };
    }

    const value = payload[field];

    if (field === "nombre") {
      if (typeof value !== "string" || !value.trim()) {
        return { error: "El nombre es obligatorio." };
      }
      const trimmed = value.trim();
      if (trimmed.length > 50) {
        return { error: "El nombre no puede superar los 50 caracteres." };
      }
      usuario.nombre = trimmed;
      continue;
    }

    if (field === "apellido") {
      if (typeof value !== "string" || !value.trim()) {
        return { error: "El apellido es obligatorio." };
      }
      const trimmed = value.trim();
      if (trimmed.length > 50) {
        return { error: "El apellido no puede superar los 50 caracteres." };
      }
      usuario.apellido = trimmed;
      continue;
    }

    if (field === "nombreUsuario") {
      if (typeof value !== "string" || !value.trim()) {
        return { error: "El nombre de usuario es obligatorio." };
      }
      const trimmed = value.trim();
      if (!USERNAME_REGEX.test(trimmed)) {
        return {
          error:
            "El nombre de usuario debe tener entre 3 y 30 caracteres (solo letras, números, punto, guion o guion bajo).",
        };
      }
      usuario.nombreUsuario = trimmed;
      continue;
    }

    if (field === "email") {
      if (typeof value !== "string" || !value.trim()) {
        return { error: "El correo electrónico es obligatorio." };
      }
      const normalized = value.trim().toLowerCase();
      if (normalized.length > 100 || !EMAIL_REGEX.test(normalized)) {
        return { error: "El correo electrónico no es válido." };
      }
      usuario.email = normalized;
      continue;
    }

    if (field === "password") {
      // En edición parcial/PUT, omitir contraseña vacía permite mantener la actual
      if (partial && (value === "" || value === null || value === undefined)) {
        continue;
      }
      if (typeof value !== "string" || value.length < 6) {
        return { error: "La contraseña debe tener al menos 6 caracteres." };
      }
      if (value.length > 100) {
        return { error: "La contraseña no puede superar los 100 caracteres." };
      }
      usuario.password = value;
      continue;
    }

    if (field === "rol") {
      if (typeof value === "number" && Number.isInteger(value) && value > 0) {
        usuario.rolInput = { type: "id", value };
        continue;
      }
      if (typeof value === "string" && value.trim()) {
        const trimmed = value.trim();
        if (/^\d+$/.test(trimmed)) {
          const parsed = Number(trimmed);
          if (Number.isSafeInteger(parsed) && parsed > 0) {
            usuario.rolInput = { type: "id", value: parsed };
            continue;
          }
        }
        usuario.rolInput = { type: "nombre", value: trimmed };
        continue;
      }
      return { error: "El rol del usuario no es válido." };
    }

    if (field === "activo") {
      const parsedActivo = parseActivo(value);
      if (parsedActivo === null) {
        return { error: "El estado activo debe ser booleano (true/false) o 0/1." };
      }
      usuario.activo = parsedActivo;
    }
  }

  if (partial && Object.keys(usuario).length === 0) {
    return { error: "Debe enviar al menos un campo válido para actualizar." };
  }

  return { data: usuario };
}

export function formatUsuarioResponse(row) {
  if (!row) return null;
  const rolObj = Array.isArray(row.rol) ? row.rol[0] : row.rol;
  return {
    idUsuario: row.idUsuario,
    nombre: row.nombre,
    apellido: row.apellido,
    nombreUsuario: row.nombreUsuario,
    email: row.email,
    activo: Number(row.activo) === 1,
    idRol: rolObj?.idRol ?? (typeof row.rol === "number" ? row.rol : null),
    rol: rolObj?.nombre ?? "",
  };
}
