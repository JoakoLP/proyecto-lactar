import { apiSuccess } from "@/utils/apiResponse";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/utils/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = apiSuccess(null, "Sesión cerrada correctamente.");
  response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieOptions(0));
  return response;
}
