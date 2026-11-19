import { apiError, apiSuccess } from "@/utils/apiResponse";
import { getVerifiedUserFromSession } from "@/utils/authServer";
import {
  getSessionCookieOptions,
  getSessionFromRequest,
  SESSION_COOKIE_NAME,
} from "@/utils/session";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return apiError("No hay una sesión activa.", 401);
    }

    const verifiedUser = await getVerifiedUserFromSession(session);
    if (!verifiedUser) {
      const response = apiError(
        "Tu sesión expiró o el usuario fue desactivado.",
        401
      );
      response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieOptions(0));
      return response;
    }

    return apiSuccess(verifiedUser, "Sesión activa.");
  } catch (error) {
    return apiError("Error al verificar la sesión.", 500, error.message);
  }
}
