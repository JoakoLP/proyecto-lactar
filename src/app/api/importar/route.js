import crypto from "node:crypto";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { hashPassword } from "@/utils/password";
import { ROLES } from "@/utils/permissions";
import {
  ENTIDADES_IMPORTACION,
  validateImportRows,
} from "@/utils/importacionValidation";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

async function parseUploadedFile(file) {
  const fileName = (file.name || "").toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (fileName.endsWith(".csv")) {
    const text = buffer.toString("utf-8").replace(/^\uFEFF/, "");
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: "greedy",
    });

    if (parsed.errors?.length > 0) {
      return {
        error: `Error al parsear el CSV en fila ${parsed.errors[0].row ?? "?"}: ${parsed.errors[0].message}`,
      };
    }

    return { rows: parsed.data ?? [] };
  }

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return { error: "El archivo Excel no contiene hojas." };
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      return { rows };
    } catch {
      return {
        error:
          "No se pudo leer el archivo Excel. Verificá que el formato sea válido (.xlsx o .xls).",
      };
    }
  }

  return {
    error: "Formato de archivo no soportado. Solo se admiten archivos .csv, .xls o .xlsx.",
  };
}

async function importClientes(validRows) {
  const cuits = validRows.map((r) => r.record.cuit);
  const { data: existentes, error: queryError } = await supabase
    .from("cliente")
    .select("cuit")
    .in("cuit", cuits);

  if (queryError) {
    return {
      error: "Error al verificar clientes existentes en la base de datos.",
      status: 500,
      details: queryError.message,
    };
  }

  const existingCuits = new Set((existentes ?? []).map((c) => c.cuit));
  const toInsert = [];
  const omitidos = [];

  for (const row of validRows) {
    if (existingCuits.has(row.record.cuit)) {
      omitidos.push({
        fila: row.fila,
        identificador: row.record.cuit,
        motivo: "Ya existe un cliente registrado con ese CUIT.",
      });
    } else {
      toInsert.push(row.record);
    }
  }

  let insertados = [];
  if (toInsert.length > 0) {
    const { data, error: insertError } = await supabase
      .from("cliente")
      .insert(toInsert)
      .select("idCliente, razonSocial, cuit, activo");

    if (insertError) {
      return {
        error: "Error al insertar los clientes en la base de datos.",
        status: insertError.code === "23505" ? 409 : 500,
        details: insertError.message,
      };
    }
    insertados = data ?? [];
  }

  return { insertados, omitidos };
}

async function importProductos(validRows) {
  const { data: existentes, error: queryError } = await supabase
    .from("producto")
    .select("nombre");

  if (queryError) {
    return {
      error: "Error al verificar productos existentes en la base de datos.",
      status: 500,
      details: queryError.message,
    };
  }

  const existingNames = new Set(
    (existentes ?? []).map((p) => p.nombre.toLowerCase())
  );
  const toInsert = [];
  const omitidos = [];

  for (const row of validRows) {
    if (existingNames.has(row.record.nombre.toLowerCase())) {
      omitidos.push({
        fila: row.fila,
        identificador: row.record.nombre,
        motivo: "Ya existe un producto registrado con ese nombre.",
      });
    } else {
      toInsert.push(row.record);
    }
  }

  let insertados = [];
  if (toInsert.length > 0) {
    const { data, error: insertError } = await supabase
      .from("producto")
      .insert(toInsert)
      .select("idProducto, nombre, precioBase, tiempoMaduracion, rendimientoEsperado");

    if (insertError) {
      return {
        error: "Error al insertar los productos en la base de datos.",
        status: insertError.code === "23505" ? 409 : 500,
        details: insertError.message,
      };
    }
    insertados = data ?? [];
  }

  return { insertados, omitidos };
}

async function importUsuarios(validRows) {
  const { data: existentes, error: queryError } = await supabase
    .from("usuario")
    .select("nombreUsuario, email");

  if (queryError) {
    return {
      error: "Error al verificar usuarios existentes en la base de datos.",
      status: 500,
      details: queryError.message,
    };
  }

  const existingUsernames = new Set(
    (existentes ?? []).map((u) => u.nombreUsuario.toLowerCase())
  );
  const existingEmails = new Set(
    (existentes ?? []).map((u) => u.email.toLowerCase())
  );

  const toInsert = [];
  const omitidos = [];
  let usuariosConPasswordProvisoria = 0;

  for (const row of validRows) {
    const usernameExists = existingUsernames.has(
      row.record.nombreUsuario.toLowerCase()
    );
    const emailExists = existingEmails.has(row.record.email.toLowerCase());

    if (usernameExists || emailExists) {
      omitidos.push({
        fila: row.fila,
        identificador: row.record.nombreUsuario,
        motivo: usernameExists
          ? "Ya existe un usuario con ese nombre de usuario."
          : "Ya existe un usuario con ese correo electrónico.",
      });
      continue;
    }

    const plainPassword =
      row.plainPassword || crypto.randomBytes(12).toString("base64url");
    if (row.usedDefaultPassword) {
      usuariosConPasswordProvisoria += 1;
    }

    const passwordHash = await hashPassword(plainPassword);
    toInsert.push({
      ...row.record,
      password: passwordHash,
    });
  }

  let insertados = [];
  if (toInsert.length > 0) {
    const { data, error: insertError } = await supabase
      .from("usuario")
      .insert(toInsert)
      .select("idUsuario, nombreUsuario, nombre, apellido, email, activo, rol(idRol, nombre)");

    if (insertError) {
      return {
        error: "Error al insertar los usuarios en la base de datos.",
        status: insertError.code === "23505" ? 409 : 500,
        details: insertError.message,
      };
    }
    insertados = data ?? [];
  }

  return { insertados, omitidos, usuariosConPasswordProvisoria };
}

export async function POST(request) {
  const auth = await requireAuth(request, { roles: [ROLES.ADMIN] });
  if (auth.errorResponse) return auth.errorResponse;

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return apiError(
      "La solicitud debe enviarse como multipart/form-data con los campos 'entidad' y 'file'.",
      400
    );
  }

  const entidad = String(formData.get("entidad") || "")
    .trim()
    .toLowerCase();
  const file = formData.get("file");

  if (!ENTIDADES_IMPORTACION.includes(entidad)) {
    return apiError(
      `Entidad inválida. Valores permitidos: ${ENTIDADES_IMPORTACION.join(", ")}.`,
      400
    );
  }

  if (!file || typeof file.arrayBuffer !== "function") {
    return apiError("Debe adjuntar un archivo .csv o .xlsx para importar.", 400);
  }

  if (file.size === 0) {
    return apiError("El archivo adjunto está vacío.", 400);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return apiError("El archivo supera el tamaño máximo permitido de 5 MB.", 400);
  }

  const parsed = await parseUploadedFile(file);
  if (parsed.error) {
    return apiError(parsed.error, 400);
  }

  try {
    const context = {};
    if (entidad === "usuarios") {
      const { data: roles, error: rolesError } = await supabase
        .from("rol")
        .select("idRol, nombre");
      if (rolesError) {
        return apiError(
          "No se pudieron consultar los roles configurados en Supabase.",
          500,
          rolesError.message
        );
      }
      context.rolesByName = new Map(
        (roles ?? []).map((r) => [r.nombre.toLowerCase(), r.idRol])
      );
      context.rolesById = new Map((roles ?? []).map((r) => [r.idRol, r.nombre]));
    }

    const { validRows, errors, structureError } = validateImportRows(
      entidad,
      parsed.rows,
      context
    );
    if (structureError) {
      return apiError(structureError.error, 400, {
        tipo: "estructura_invalida",
        entidadSeleccionada: entidad,
        entidadDetectada: structureError.entidadDetectada,
        faltantes: structureError.faltantes,
        noReconocidas: structureError.noReconocidas,
        errores: errors,
      });
    }
    if (errors.length > 0) {
      return apiError(
        `Se encontraron ${errors.length} error(es) de validación contra el esquema de '${entidad}'. No se importó ningún registro.`,
        400,
        {
          totalFilas: parsed.rows.length,
          totalErrores: errors.length,
          errores: errors.slice(0, 50),
        }
      );
    }

    let result;
    if (entidad === "clientes") {
      result = await importClientes(validRows);
    } else if (entidad === "productos") {
      result = await importProductos(validRows);
    } else {
      result = await importUsuarios(validRows);
    }

    if (result.error) {
      return apiError(result.error, result.status, result.details ?? null);
    }

    const insertadosCount = result.insertados.length;
    const omitidosCount = result.omitidos.length;

    const mensaje =
      insertadosCount > 0
        ? `Importación de ${entidad} completada: ${insertadosCount} registro(s) insertado(s)${
            omitidosCount > 0 ? ` y ${omitidosCount} omitido(s) por existir previamente` : ""
          }.`
        : `No se insertaron registros nuevos: los ${omitidosCount} registro(s) del archivo ya existían en la base de datos.`;

    return apiSuccess(
      {
        entidad,
        totalFilas: parsed.rows.length,
        insertados: insertadosCount,
        omitidos: omitidosCount,
        detallesOmitidos: result.omitidos,
        usuariosConPasswordProvisoria: result.usuariosConPasswordProvisoria ?? 0,
      },
      mensaje,
      insertadosCount > 0 ? 201 : 200
    );
  } catch (error) {
    return apiError(
      "Error interno al procesar la importación.",
      500,
      error.message
    );
  }
}
