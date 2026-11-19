export const SESSION_COOKIE_NAME = "lactar_session";

const DEFAULT_TTL_SECONDS = 60 * 60 * 8; // 8 horas
const REMEMBER_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSessionSecret() {
  return (
    process.env.LACTAR_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "lactar-dev-session-secret-change-me"
  );
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey() {
  return globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export function getSessionMaxAge(rememberMe = false) {
  return rememberMe ? REMEMBER_TTL_SECONDS : DEFAULT_TTL_SECONDS;
}

export function getSessionCookieOptions(maxAge = DEFAULT_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function createSessionToken(user, { rememberMe = false } = {}) {
  const maxAge = getSessionMaxAge(rememberMe);
  const payload = {
    idUsuario: user.idUsuario,
    nombreUsuario: user.nombreUsuario,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    rol: user.rol,
    esSistema: Boolean(user.esSistema),
    exp: Date.now() + maxAge * 1000,
  };

  const payloadB64 = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await getHmacKey();
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  const signatureB64 = bytesToBase64Url(new Uint8Array(signature));

  return {
    token: `${payloadB64}.${signatureB64}`,
    maxAge,
    payload,
  };
}

export async function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  try {
    const key = await getHmacKey();
    const signatureBytes = base64UrlToBytes(signatureB64);
    const valid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(payloadB64)
    );

    if (!valid) return null;

    const payloadJson = decoder.decode(base64UrlToBytes(payloadB64));
    const payload = JSON.parse(payloadJson);

    if (
      !payload ||
      typeof payload.idUsuario !== "number" ||
      typeof payload.rol !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request) {
  const token = request.cookies?.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
