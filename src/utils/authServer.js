import { supabase } from "@/services/supabase";
import { apiError } from "@/utils/apiResponse";
import { getSessionFromRequest } from "@/utils/session";

const SELECT_AUTH_USER =
  "idUsuario, nombre, apellido, nombreUsuario, email, activo, esSistema, rol(idRol, nombre)";

export function formatAuthUser(row) {
  if (!row) return null;
  const rolObj = Array.isArray(row.rol) ? row.rol[0] : row.rol;
  return {
    idUsuario: row.idUsuario,
    nombre: row.nombre,
    apellido: row.apellido,
    nombreUsuario: row.nombreUsuario,
    email: row.email,
    activo: Number(row.activo) === 1,
    esSistema: Number(row.esSistema ?? 0) === 1,
    idRol: rolObj?.idRol ?? null,
    rol: rolObj?.nombre ?? "",
  };
}

/**
 * Obtiene y revalida al usuario autenticado contra la base de datos.
 * Garantiza que un usuario desactivado o cuyo rol fue revocado pierda acceso al instante.
 */
export async function getVerifiedUserFromSession(session) {
  if (!session?.idUsuario) return null;

  const { data, error } = await supabase
    .from("usuario")
    .select(SELECT_AUTH_USER)
    .eq("idUsuario", session.idUsuario)
    .maybeSingle();

  if (error || !data) return null;
  const user = formatAuthUser(data);
  if (!user.activo) return null;
  return user;
}

/**
 * Middleware helper para Route Handlers que requieren autenticación y/o roles específicos.
 */
export async function requireAuth(request, { roles = null, verifyInDb = true } = {}) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return {
      errorResponse: apiError("Debés iniciar sesión para realizar esta operación.", 401),
    };
  }

  let user = session;
  if (verifyInDb) {
    const verified = await getVerifiedUserFromSession(session);
    if (!verified) {
      return {
        errorResponse: apiError("Tu sesión ya no es válida o el usuario está inactivo.", 401),
      };
    }
    user = verified;
  }

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user.rol)) {
    return {
      errorResponse: apiError("No tenés permisos suficientes para realizar esta operación.", 403),
    };
  }

  return { user };
}
