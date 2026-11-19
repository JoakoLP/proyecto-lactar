import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { formatAuthUser } from "@/utils/authServer";
import { verifyPassword } from "@/utils/password";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/utils/session";

export const dynamic = "force-dynamic";

const SELECT_LOGIN_USER =
  "idUsuario, nombre, apellido, nombreUsuario, email, password, activo, esSistema, rol(idRol, nombre)";

async function findUserByIdentifier(identificador) {
  const normalized = identificador.trim();
  const isEmail = normalized.includes("@");
  const primaryCol = isEmail ? "email" : "nombreUsuario";
  const secondaryCol = isEmail ? "nombreUsuario" : "email";

  const primary = await supabase
    .from("usuario")
    .select(SELECT_LOGIN_USER)
    .ilike(primaryCol, normalized)
    .maybeSingle();

  if (primary.error) return { error: primary.error };
  if (primary.data) return { data: primary.data };

  const secondary = await supabase
    .from("usuario")
    .select(SELECT_LOGIN_USER)
    .ilike(secondaryCol, normalized)
    .maybeSingle();

  return secondary;
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError("El cuerpo de la solicitud debe ser JSON válido.", 400);
  }

  const identificador = String(
    payload?.identificador ?? payload?.username ?? ""
  ).trim();
  const password = typeof payload?.password === "string" ? payload.password : "";
  const rememberMe = Boolean(payload?.rememberMe);

  if (!identificador || !password) {
    return apiError("Ingresá tu usuario (o correo) y contraseña.", 400);
  }

  try {
    const { data, error } = await findUserByIdentifier(identificador);
    if (error) {
      return apiError(
        "No se pudo verificar las credenciales en este momento.",
        500,
        error.message
      );
    }

    if (!data) {
      return apiError("Usuario o contraseña incorrectos.", 401);
    }

    const passwordValid = await verifyPassword(password, data.password);
    if (!passwordValid) {
      return apiError("Usuario o contraseña incorrectos.", 401);
    }

    const user = formatAuthUser(data);
    if (!user.activo) {
      return apiError(
        "Tu usuario se encuentra inactivo. Contactá a un Administrador.",
        403
      );
    }

    const { token, maxAge } = await createSessionToken(user, { rememberMe });
    const response = apiSuccess(user, "Inicio de sesión exitoso.");
    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      getSessionCookieOptions(maxAge)
    );

    return response;
  } catch (err) {
    return apiError("Error interno al iniciar sesión.", 500, err.message);
  }
}
