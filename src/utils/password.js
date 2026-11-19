import crypto from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

/**
 * Hashea una contraseña usando scrypt con salt aleatorio por usuario.
 * Formato almacenado: scrypt$<saltHex>$<hashHex>
 */
export async function hashPassword(plainPassword) {
  if (typeof plainPassword !== "string" || plainPassword.length === 0) {
    throw new Error("La contraseña no puede estar vacía.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(plainPassword, salt, KEY_LENGTH);
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString("hex")}`;
}

/**
 * Verifica una contraseña en texto plano contra un hash generado con hashPassword.
 */
export async function verifyPassword(plainPassword, storedHash) {
  if (typeof plainPassword !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, salt, hashHex] = parts;
  const derivedKey = Buffer.from(await scryptAsync(plainPassword, salt, KEY_LENGTH));
  const storedKey = Buffer.from(hashHex, "hex");

  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, storedKey);
}
