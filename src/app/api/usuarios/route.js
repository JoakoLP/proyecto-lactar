import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { hashPassword } from "@/utils/password";
import {
  formatUsuarioResponse,
  validateUsuarioPayload,
} from "@/utils/usuarioValidation";

export const dynamic = "force-dynamic";

const SELECT_USUARIO =
  "idUsuario, nombre, apellido, nombreUsuario, email, activo, rol(idRol, nombre)";

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
    return "Ya existe un usuario registrado con ese correo electrónico.";
  }
  if (detailText.includes("nombreusuario")) {
    return "Ya existe un usuario registrado con ese nombre de usuario.";
  }
  return "Ya existe un usuario con ese nombre de usuario o correo electrónico.";
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("usuario")
      .select(SELECT_USUARIO)
      .order("idUsuario", { ascending: true });

    if (error) {
      return apiError("Error al consultar los usuarios.", 500, error.message);
    }

    return apiSuccess(
      (data ?? []).map(formatUsuarioResponse),
      "Usuarios obtenidos correctamente."
    );
  } catch (error) {
    return apiError("Error interno al consultar los usuarios.", 500, error.message);
  }
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError("El cuerpo de la solicitud debe ser JSON válido.", 400);
  }

  const validation = validateUsuarioPayload(payload);
  if (validation.error) {
    return apiError(validation.error, 400, validation.details ?? null);
  }

  try {
    const rolResult = await resolveRolId(validation.data.rolInput);
    if (rolResult.error) {
      return apiError(rolResult.error, rolResult.status, rolResult.details ?? null);
    }

    const passwordHash = await hashPassword(validation.data.password);

    const { data, error } = await supabase
      .from("usuario")
      .insert([
        {
          nombre: validation.data.nombre,
          apellido: validation.data.apellido,
          nombreUsuario: validation.data.nombreUsuario,
          email: validation.data.email,
          password: passwordHash,
          activo: validation.data.activo,
          rol: rolResult.idRol,
        },
      ])
      .select(SELECT_USUARIO)
      .single();

    if (error?.code === "23505") {
      return apiError(getDuplicateUsuarioMessage(error), 409);
    }
    if (error) {
      return apiError("No se pudo registrar el usuario.", 500, error.message);
    }

    return apiSuccess(
      formatUsuarioResponse(data),
      "Usuario registrado correctamente.",
      201
    );
  } catch (error) {
    return apiError("Error interno al registrar el usuario.", 500, error.message);
  }
}
