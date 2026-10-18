import { NextResponse } from "next/server";

/**
 * Devuelve una respuesta JSON exitosa estandarizada.
 * @param {any} data - Carga útil de datos
 * @param {string} [message="Operación exitosa"] - Mensaje informativo
 * @param {number} [status=200] - Código de estado HTTP
 */
export function apiSuccess(data = null, message = "Operación exitosa", status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Devuelve una respuesta JSON de error estandarizada.
 * @param {string} [message="Ocurrió un error inesperado"] - Mensaje descriptivo del error
 * @param {number} [status=400] - Código de estado HTTP
 * @param {any} [details=null] - Información o errores de validación adicionales
 */
export function apiError(message = "Ocurrió un error inesperado", status = 400, details = null) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status }
  );
}
