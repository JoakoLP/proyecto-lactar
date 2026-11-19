import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { requireAuth } from "@/utils/authServer";
import { hashPassword } from "@/utils/password";
import { ROLES } from "@/utils/permissions";
import {
  formatUsuarioResponse,
  validateUsuarioPayload,
} from "@/utils/usuarioValidation";

export const dynamic = "force-dynamic";

const SELECT_USUARIO =
  "idUsuario, nombre, apellido, nombreUsuario, email, activo, esSistema, rol(idRol, nombre)";

function parseUsuarioId(value) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function getUsuarioId(context) {
  const { idUsuario } = await context.params;
  return parseUsuarioId(idUsuario);
}

async function fetchTargetUser(idUsuario) {
  return supabase
    .from("usuario")
    .select(SELECT_USUARIO)
    .eq("idUsuario", idUsuario)
    .maybeSingle();
}

async function resolveRolId(rolInput) {
  const query = supabase.from("rol").select("idRol, nombre");

  if (rolInput.type === "id") {
    const { data, error } = await query.eq("idRol", rolInput.value).maybeSingle();
    if (error) return { error: "Error al validar el rol solicitado.", status: 500, details: error.message };
    if (!data) return { error: "El rol especificado no existe.", status: 400 };
    return { idRol: data.idRol };
  }

  const { data, error } = await query.ilike("nombre", rolInput.value).maybeSingle();
  if (error) return { error: "Error al validar el rol solicitado.", status: 500, details: error.message };
  if (!data) {
    return {
      error: "El rol especificado no existe. Valores válidos: Administrador, Operario, Vendedor.",
      status: 400,
    };
  }
  return { idRol: data.idRol };
}

function getDuplicateUsuarioMessage(error) {
  const detailText = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  if (detailText.includes("email")) {
    return "Ya existe otro usuario registrado con ese correo electrónico.";
  }
  if (detailText.includes("nombreusuario")) {
    return "Ya existe otro usuario registrado con ese nombre de usuario.";
  }
  return "Ya existe otro usuario con ese nombre de usuario o correo electrónico.";
}

export async function GET(request, context) {
  const auth = await requireAuth(request, { roles: [ROLES.ADMIN] });
  if (auth.errorResponse) return auth.errorResponse;

  const idUsuario = await getUsuarioId(context);
  if (!idUsuario) {
    return apiError("El identificador del usuario no es válido.", 400);
  }

  try {
    const { data, error } = await fetchTargetUser(idUsuario);

    if (error) {
      return apiError("Error al consultar el usuario.", 500, error.message);
    }
    if (!data) {
      return apiError("No se encontró el usuario solicitado.", 404);
    }
    if (Number(data.esSistema ?? 0) === 1) {
      return apiError(
        "La cuenta de administración del sistema no puede consultarse ni editarse desde este módulo.",
        403
      );
    }

    return apiSuccess(formatUsuarioResponse(data), "Usuario obtenido correctamente.");
  } catch (error) {
    return apiError("Error interno al consultar el usuario.", 500, error.message);
  }
}

async function handleUpdate(request, context) {
  const auth = await requireAuth(request, { roles: [ROLES.ADMIN] });
  if (auth.errorResponse) return auth.errorResponse;

  const idUsuario = await getUsuarioId(context);
  if (!idUsuario) {
    return apiError("El identificador del usuario no es válido.", 400);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError("El cuerpo de la solicitud debe ser JSON válido.", 400);
  }

  const validation = validateUsuarioPayload(payload, { partial: true });
  if (validation.error) {
    return apiError(validation.error, 400, validation.details ?? null);
  }

  try {
    const existing = await fetchTargetUser(idUsuario);
    if (existing.error) {
      return apiError("Error al verificar el usuario.", 500, existing.error.message);
    }
    if (!existing.data) {
      return apiError("No se encontró el usuario solicitado.", 404);
    }
    if (Number(existing.data.esSistema ?? 0) === 1) {
      return apiError(
        "La cuenta de administración del sistema está protegida y no puede modificarse desde el frontend.",
        403
      );
    }

    if (idUsuario === auth.user.idUsuario && validation.data.activo === 0) {
      return apiError("No podés desactivar tu propio usuario mientras estás en sesión.", 400);
    }

    const updateData = {};

    if (validation.data.nombre !== undefined) updateData.nombre = validation.data.nombre;
    if (validation.data.apellido !== undefined) updateData.apellido = validation.data.apellido;
    if (validation.data.nombreUsuario !== undefined) {
      updateData.nombreUsuario = validation.data.nombreUsuario;
    }
    if (validation.data.email !== undefined) updateData.email = validation.data.email;
    if (validation.data.activo !== undefined) updateData.activo = validation.data.activo;

    if (validation.data.rolInput) {
      const rolResult = await resolveRolId(validation.data.rolInput);
      if (rolResult.error) {
        return apiError(rolResult.error, rolResult.status, rolResult.details ?? null);
      }
      if (idUsuario === auth.user.idUsuario && rolResult.idRol !== auth.user.idRol) {
        return apiError("No podés cambiar tu propio rol mientras estás en sesión.", 400);
      }
      updateData.rol = rolResult.idRol;
    }

    if (validation.data.password) {
      updateData.password = await hashPassword(validation.data.password);
    }

    const { data, error } = await supabase
      .from("usuario")
      .update(updateData)
      .eq("idUsuario", idUsuario)
      .select(SELECT_USUARIO)
      .maybeSingle();

    if (error?.code === "23505") {
      return apiError(getDuplicateUsuarioMessage(error), 409);
    }
    if (error) {
      return apiError("No se pudo actualizar el usuario.", 500, error.message);
    }
    if (!data) {
      return apiError("No se encontró el usuario solicitado.", 404);
    }

    return apiSuccess(formatUsuarioResponse(data), "Usuario actualizado correctamente.");
  } catch (error) {
    return apiError("Error interno al actualizar el usuario.", 500, error.message);
  }
}

export async function PUT(request, context) {
  return handleUpdate(request, context);
}

export async function PATCH(request, context) {
  return handleUpdate(request, context);
}

/**
 * Eliminación física habilitada exclusivamente para Administradores (verificación de rol en BD).
 * Protege la cuenta maestra (esSistema = 1), la propia sesión y registros referenciados en FK.
 */
export async function DELETE(request, context) {
  const auth = await requireAuth(request, { roles: [ROLES.ADMIN], verifyInDb: true });
  if (auth.errorResponse) return auth.errorResponse;

  const idUsuario = await getUsuarioId(context);
  if (!idUsuario) {
    return apiError("El identificador del usuario no es válido.", 400);
  }

  if (idUsuario === auth.user.idUsuario) {
    return apiError("No podés eliminar tu propio usuario mientras estás en sesión.", 400);
  }

  try {
    const existing = await fetchTargetUser(idUsuario);
    if (existing.error) {
      return apiError("Error al verificar el usuario.", 500, existing.error.message);
    }
    if (!existing.data) {
      return apiError("No se encontró el usuario solicitado.", 404);
    }
    if (Number(existing.data.esSistema ?? 0) === 1) {
      return apiError(
        "La cuenta de administración del sistema está protegida y no puede eliminarse.",
        403
      );
    }

    const { data, error } = await supabase
      .from("usuario")
      .delete()
      .eq("idUsuario", idUsuario)
      .select("idUsuario, nombreUsuario")
      .maybeSingle();

    if (error?.code === "23503") {
      return apiError(
        "No se puede eliminar este usuario porque tiene lotes o cobranzas asociadas en el historial. Podés desactivarlo en su lugar.",
        409
      );
    }
    if (error) {
      return apiError("No se pudo eliminar el usuario.", 500, error.message);
    }
    if (!data) {
      return apiError("No se encontró el usuario solicitado.", 404);
    }

    return apiSuccess(data, "Usuario eliminado correctamente.");
  } catch (error) {
    return apiError("Error interno al eliminar el usuario.", 500, error.message);
  }
}
