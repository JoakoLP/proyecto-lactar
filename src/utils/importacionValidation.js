const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

export const ENTIDADES_IMPORTACION = ["clientes", "usuarios", "productos"];

const ETIQUETAS_ENTIDAD = {
  clientes: "Clientes",
  usuarios: "Usuarios",
  productos: "Productos",
};

export const ESQUEMA_COLUMNAS = {
  clientes: {
    required: ["razonSocial", "cuit"],
    optional: ["domicilio", "telefono", "email", "activo", "saldo"],
    legacyAliases: ["direccion", "localidad", "provincia"],
  },
  usuarios: {
    required: ["nombreUsuario", "nombre", "apellido", "email", "rol"],
    optional: ["password", "activo"],
    legacyAliases: ["contrasena"],
  },
  productos: {
    required: ["nombre", "precioBase"],
    optional: ["rendimientoEsperado", "tiempoMaduracion"],
    legacyAliases: ["precioVenta"],
  },
};

function normalizeHeader(header) {
  return String(header || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();
}

/**
 * Valida si los encabezados de un archivo CSV/Excel corresponden a la entidad seleccionada.
 * También detecta si el archivo parece pertenecer a otra entidad para dar un mensaje claro.
 */
export function validarEstructuraColumnas(entidad, rawHeaders = []) {
  const schema = ESQUEMA_COLUMNAS[entidad];
  if (!schema) {
    return {
      ok: false,
      error: `Entidad '${entidad}' no soportada.`,
      entidadDetectada: null,
      faltantes: [],
      noReconocidas: [],
    };
  }

  const cleanHeaders = rawHeaders
    .map((h) => String(h || "").replace(/^\uFEFF/, "").trim())
    .filter(Boolean);

  if (cleanHeaders.length === 0) {
    return {
      ok: false,
      error: "El archivo no tiene encabezados de columnas válidos en la primera fila.",
      entidadDetectada: null,
      faltantes: schema.required,
      noReconocidas: [],
    };
  }

  const normalizedSet = new Set(cleanHeaders.map(normalizeHeader));

  // Compatibilidad: en productos, 'precioVenta' cubre el requerido 'precioBase'
  const hasRequired = (reqCol, targetEntidad) => {
    const norm = normalizeHeader(reqCol);
    if (normalizedSet.has(norm)) return true;
    if (targetEntidad === "productos" && norm === "preciobase" && normalizedSet.has("precioventa")) {
      return true;
    }
    return false;
  };

  const faltantes = schema.required.filter((col) => !hasRequired(col, entidad));

  const allowedSet = new Set(
    [...schema.required, ...schema.optional, ...schema.legacyAliases].map(normalizeHeader)
  );
  const noReconocidas = cleanHeaders.filter(
    (h) => !allowedSet.has(normalizeHeader(h))
  );

  // Detectar si las columnas coinciden claramente con otra entidad
  let entidadDetectada = null;
  for (const otra of ENTIDADES_IMPORTACION) {
    if (otra === entidad) continue;
    const otroSchema = ESQUEMA_COLUMNAS[otra];
    const cumpleRequeridosOtra = otroSchema.required.every((col) =>
      hasRequired(col, otra)
    );
    if (cumpleRequeridosOtra) {
      entidadDetectada = otra;
      break;
    }
  }

  if (faltantes.length > 0 || noReconocidas.length > 0) {
    const nombreSel = ETIQUETAS_ENTIDAD[entidad] || entidad;

    if (entidadDetectada) {
      const nombreDet = ETIQUETAS_ENTIDAD[entidadDetectada];
      return {
        ok: false,
        entidadDetectada,
        faltantes,
        noReconocidas,
        error: `Estructura incompatible: seleccionaste importar "${nombreSel}", pero el archivo cargado corresponde a la estructura de "${nombreDet}". Cambiá la entidad a "${nombreDet}" o cargá un archivo con el formato de "${nombreSel}".`,
      };
    }

    const partes = [
      `El archivo no coincide con la estructura esperada para "${nombreSel}".`,
    ];
    if (faltantes.length > 0) {
      partes.push(`Faltan columnas obligatorias: ${faltantes.join(", ")}.`);
    }
    if (noReconocidas.length > 0) {
      partes.push(`Columnas no reconocidas para ${nombreSel}: ${noReconocidas.join(", ")}.`);
    }

    return {
      ok: false,
      entidadDetectada: null,
      faltantes,
      noReconocidas,
      error: partes.join(" "),
    };
  }

  return {
    ok: true,
    entidadDetectada: entidad,
    faltantes: [],
    noReconocidas: [],
  };
}

function normalizeString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseFlexibleActivo(raw, defaultValue = 1) {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return { value: defaultValue };
  }
  if (typeof raw === "boolean") {
    return { value: raw ? 1 : 0 };
  }
  const normalized = String(raw).trim().toLowerCase();
  if (["1", "true", "si", "sí", "activo", "yes"].includes(normalized)) {
    return { value: 1 };
  }
  if (["0", "false", "no", "inactivo"].includes(normalized)) {
    return { value: 0 };
  }
  return { error: "El campo 'activo' debe ser true/false o 1/0." };
}

function parseDecimal(raw, { required = false, min = null, max = null, fieldName }) {
  const str = normalizeString(raw).replace(",", ".");
  if (!str) {
    if (required) {
      return { error: `El campo '${fieldName}' es obligatorio.` };
    }
    return { value: null };
  }

  const num = Number(str);
  if (!Number.isFinite(num)) {
    return { error: `El campo '${fieldName}' debe ser un número válido.` };
  }
  if (min !== null && num < min) {
    return { error: `El campo '${fieldName}' debe ser mayor o igual a ${min}.` };
  }
  if (max !== null && num > max) {
    return { error: `El campo '${fieldName}' no puede superar ${max}.` };
  }
  return { value: Math.round(num * 100) / 100 };
}

function parseInteger(raw, { required = false, min = null, max = null, defaultValue = null, fieldName }) {
  const str = normalizeString(raw);
  if (!str) {
    if (required) {
      return { error: `El campo '${fieldName}' es obligatorio.` };
    }
    return { value: defaultValue };
  }

  if (!/^-?\d+$/.test(str)) {
    return { error: `El campo '${fieldName}' debe ser un número entero.` };
  }

  const num = Number(str);
  if (!Number.isSafeInteger(num)) {
    return { error: `El campo '${fieldName}' está fuera de rango.` };
  }
  if (min !== null && num < min) {
    return { error: `El campo '${fieldName}' debe ser mayor o igual a ${min}.` };
  }
  if (max !== null && num > max) {
    return { error: `El campo '${fieldName}' no puede superar ${max}.` };
  }
  return { value: num };
}

function getFieldInsensitive(row, ...candidateNames) {
  const keys = Object.keys(row);
  for (const candidate of candidateNames) {
    if (candidate in row) return row[candidate];
    const lower = candidate.toLowerCase();
    const matchedKey = keys.find((k) => k.trim().toLowerCase() === lower);
    if (matchedKey !== undefined) return row[matchedKey];
  }
  return undefined;
}

function validateClienteRows(rows) {
  const errors = [];
  const validRows = [];
  const seenCuits = new Map();

  rows.forEach((row, index) => {
    const fila = index + 2;
    const razonSocial = normalizeString(getFieldInsensitive(row, "razonSocial"));
    const cuitRaw = normalizeString(getFieldInsensitive(row, "cuit")).replace(/[-\s]/g, "");
    const telefonoRaw = normalizeString(getFieldInsensitive(row, "telefono")).replace(/[-\s()+]/g, "");
    const emailRaw = normalizeString(getFieldInsensitive(row, "email")).toLowerCase();

    let domicilio = normalizeString(getFieldInsensitive(row, "domicilio"));
    if (!domicilio) {
      const partes = [
        normalizeString(getFieldInsensitive(row, "direccion")),
        normalizeString(getFieldInsensitive(row, "localidad")),
        normalizeString(getFieldInsensitive(row, "provincia")),
      ].filter(Boolean);
      domicilio = partes.join(", ");
    }

    const activoParsed = parseFlexibleActivo(getFieldInsensitive(row, "activo"), 1);
    const saldoParsed = parseDecimal(getFieldInsensitive(row, "saldo"), {
      required: false,
      min: -99999999.99,
      max: 99999999.99,
      fieldName: "saldo",
    });

    const rowErrors = [];

    if (!razonSocial) {
      rowErrors.push({ fila, campo: "razonSocial", mensaje: "La razón social es obligatoria." });
    } else if (razonSocial.length > 100) {
      rowErrors.push({ fila, campo: "razonSocial", mensaje: "No puede superar los 100 caracteres." });
    }

    if (!/^\d{11}$/.test(cuitRaw)) {
      rowErrors.push({ fila, campo: "cuit", mensaje: "El CUIT debe tener exactamente 11 dígitos numéricos." });
    } else if (seenCuits.has(cuitRaw)) {
      rowErrors.push({
        fila,
        campo: "cuit",
        mensaje: `CUIT duplicado dentro del archivo (ya aparece en la fila ${seenCuits.get(cuitRaw)}).`,
      });
    } else {
      seenCuits.set(cuitRaw, fila);
    }

    if (domicilio && domicilio.length > 120) {
      rowErrors.push({ fila, campo: "domicilio", mensaje: "El domicilio no puede superar los 120 caracteres." });
    }

    if (telefonoRaw && !/^\d{1,20}$/.test(telefonoRaw)) {
      rowErrors.push({
        fila,
        campo: "telefono",
        mensaje: "El teléfono debe contener solo números (hasta 20 dígitos).",
      });
    }

    if (emailRaw && (emailRaw.length > 100 || !EMAIL_REGEX.test(emailRaw))) {
      rowErrors.push({ fila, campo: "email", mensaje: "El correo electrónico no es válido." });
    }

    if (activoParsed.error) {
      rowErrors.push({ fila, campo: "activo", mensaje: activoParsed.error });
    }

    if (saldoParsed.error) {
      rowErrors.push({ fila, campo: "saldo", mensaje: saldoParsed.error });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    validRows.push({
      fila,
      record: {
        razonSocial,
        cuit: cuitRaw,
        domicilio: domicilio || null,
        telefono: telefonoRaw || null,
        email: emailRaw || null,
        activo: activoParsed.value,
        saldo: saldoParsed.value ?? 0,
      },
    });
  });

  return { validRows, errors };
}

function validateUsuarioRows(rows, { rolesByName, rolesById }) {
  const errors = [];
  const validRows = [];
  const seenUsernames = new Map();
  const seenEmails = new Map();

  rows.forEach((row, index) => {
    const fila = index + 2;
    const nombreUsuario = normalizeString(getFieldInsensitive(row, "nombreUsuario"));
    const nombre = normalizeString(getFieldInsensitive(row, "nombre"));
    const apellido = normalizeString(getFieldInsensitive(row, "apellido"));
    const email = normalizeString(getFieldInsensitive(row, "email")).toLowerCase();
    const rolRaw = normalizeString(getFieldInsensitive(row, "rol"));
    const passwordRaw = normalizeString(getFieldInsensitive(row, "password", "contrasena"));
    const activoParsed = parseFlexibleActivo(getFieldInsensitive(row, "activo"), 1);

    const rowErrors = [];

    if (!nombreUsuario) {
      rowErrors.push({ fila, campo: "nombreUsuario", mensaje: "El nombre de usuario es obligatorio." });
    } else if (!USERNAME_REGEX.test(nombreUsuario)) {
      rowErrors.push({
        fila,
        campo: "nombreUsuario",
        mensaje: "Debe tener entre 3 y 30 caracteres (letras, números, punto, guion o guion bajo).",
      });
    } else {
      const key = nombreUsuario.toLowerCase();
      if (seenUsernames.has(key)) {
        rowErrors.push({
          fila,
          campo: "nombreUsuario",
          mensaje: `Nombre de usuario duplicado en el archivo (fila ${seenUsernames.get(key)}).`,
        });
      } else {
        seenUsernames.set(key, fila);
      }
    }

    if (!nombre) {
      rowErrors.push({ fila, campo: "nombre", mensaje: "El nombre es obligatorio." });
    } else if (nombre.length > 50) {
      rowErrors.push({ fila, campo: "nombre", mensaje: "No puede superar los 50 caracteres." });
    }

    if (!apellido) {
      rowErrors.push({ fila, campo: "apellido", mensaje: "El apellido es obligatorio." });
    } else if (apellido.length > 50) {
      rowErrors.push({ fila, campo: "apellido", mensaje: "No puede superar los 50 caracteres." });
    }

    if (!email || email.length > 100 || !EMAIL_REGEX.test(email)) {
      rowErrors.push({ fila, campo: "email", mensaje: "El correo electrónico es obligatorio y debe ser válido." });
    } else if (seenEmails.has(email)) {
      rowErrors.push({
        fila,
        campo: "email",
        mensaje: `Correo electrónico duplicado en el archivo (fila ${seenEmails.get(email)}).`,
      });
    } else {
      seenEmails.set(email, fila);
    }

    let resolvedRolId = null;
    if (!rolRaw) {
      rowErrors.push({ fila, campo: "rol", mensaje: "El rol es obligatorio (Administrador, Operario o Vendedor)." });
    } else if (/^\d+$/.test(rolRaw) && rolesById.has(Number(rolRaw))) {
      resolvedRolId = Number(rolRaw);
    } else if (rolesByName.has(rolRaw.toLowerCase())) {
      resolvedRolId = rolesByName.get(rolRaw.toLowerCase());
    } else {
      rowErrors.push({
        fila,
        campo: "rol",
        mensaje: `Rol '${rolRaw}' no reconocido. Valores válidos: Administrador, Operario, Vendedor.`,
      });
    }

    if (passwordRaw && (passwordRaw.length < 6 || passwordRaw.length > 100)) {
      rowErrors.push({
        fila,
        campo: "password",
        mensaje: "Si se incluye contraseña, debe tener entre 6 y 100 caracteres.",
      });
    }

    if (activoParsed.error) {
      rowErrors.push({ fila, campo: "activo", mensaje: activoParsed.error });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    validRows.push({
      fila,
      usedDefaultPassword: !passwordRaw,
      plainPassword: passwordRaw || null,
      record: {
        nombreUsuario,
        nombre,
        apellido,
        email,
        rol: resolvedRolId,
        activo: activoParsed.value,
      },
    });
  });

  return { validRows, errors };
}

function validateProductoRows(rows) {
  const errors = [];
  const validRows = [];
  const seenNames = new Map();

  rows.forEach((row, index) => {
    const fila = index + 2;
    const nombre = normalizeString(getFieldInsensitive(row, "nombre"));
    const rendimientoParsed = parseDecimal(
      getFieldInsensitive(row, "rendimientoEsperado"),
      { required: false, min: 0, max: 999.99, fieldName: "rendimientoEsperado" }
    );
    const maduracionParsed = parseInteger(
      getFieldInsensitive(row, "tiempoMaduracion"),
      { required: false, min: 0, max: 3650, defaultValue: 0, fieldName: "tiempoMaduracion" }
    );
    const precioRaw =
      getFieldInsensitive(row, "precioBase") !== undefined
        ? getFieldInsensitive(row, "precioBase")
        : getFieldInsensitive(row, "precioVenta");
    const precioParsed = parseDecimal(precioRaw, {
      required: true,
      min: 0,
      max: 99999999.99,
      fieldName: "precioBase",
    });

    const rowErrors = [];

    if (!nombre) {
      rowErrors.push({ fila, campo: "nombre", mensaje: "El nombre del producto es obligatorio." });
    } else if (nombre.length > 50) {
      rowErrors.push({ fila, campo: "nombre", mensaje: "No puede superar los 50 caracteres." });
    } else {
      const key = nombre.toLowerCase();
      if (seenNames.has(key)) {
        rowErrors.push({
          fila,
          campo: "nombre",
          mensaje: `Producto duplicado en el archivo (fila ${seenNames.get(key)}).`,
        });
      } else {
        seenNames.set(key, fila);
      }
    }

    if (rendimientoParsed.error) {
      rowErrors.push({ fila, campo: "rendimientoEsperado", mensaje: rendimientoParsed.error });
    }

    if (maduracionParsed.error) {
      rowErrors.push({ fila, campo: "tiempoMaduracion", mensaje: maduracionParsed.error });
    }

    if (precioParsed.error) {
      rowErrors.push({ fila, campo: "precioBase", mensaje: precioParsed.error });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    validRows.push({
      fila,
      record: {
        nombre,
        rendimientoEsperado: rendimientoParsed.value,
        tiempoMaduracion: maduracionParsed.value ?? 0,
        precioBase: precioParsed.value,
      },
    });
  });

  return { validRows, errors };
}

export function validateImportRows(entidad, rows, context = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      validRows: [],
      errors: [{ fila: 1, campo: "archivo", mensaje: "El archivo no contiene filas de datos." }],
    };
  }

  if (rows.length > 1000) {
    return {
      validRows: [],
      errors: [{ fila: 1, campo: "archivo", mensaje: "El archivo supera el máximo permitido de 1000 filas por importación." }],
    };
  }

  const headers = Object.keys(rows[0] ?? {});
  const estructura = validarEstructuraColumnas(entidad, headers);
  if (!estructura.ok) {
    return {
      validRows: [],
      structureError: estructura,
      errors: [{ fila: 1, campo: "encabezados", mensaje: estructura.error }],
    };
  }

  if (entidad === "clientes") {
    return validateClienteRows(rows);
  }
  if (entidad === "usuarios") {
    return validateUsuarioRows(rows, context);
  }
  if (entidad === "productos") {
    return validateProductoRows(rows);
  }

  return {
    validRows: [],
    errors: [{ fila: 1, campo: "entidad", mensaje: `Entidad '${entidad}' no soportada.` }],
  };
}
