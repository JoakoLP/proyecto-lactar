import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { validateClientePayload } from "@/utils/clienteValidation";

export const dynamic = "force-dynamic";

function parseClienteId(value) {
  if (!/^\d+$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function getClienteId(context) {
  const { idCliente } = await context.params;
  return parseClienteId(idCliente);
}

export async function GET(_request, context) {
  const idCliente = await getClienteId(context);
  if (!idCliente) {
    return apiError("El identificador del cliente no es válido.", 400);
  }

  try {
    const { data, error } = await supabase
      .from("cliente")
      .select("*")
      .eq("idCliente", idCliente)
      .maybeSingle();

    if (error) {
      return apiError("Error al consultar el cliente", 500, error.message);
    }
    if (!data) {
      return apiError("No se encontró el cliente solicitado.", 404);
    }

    return apiSuccess(data, "Cliente obtenido correctamente");
  } catch (error) {
    return apiError("Error interno en el servidor", 500, error.message);
  }
}

export async function PUT(request, context) {
  const idCliente = await getClienteId(context);
  if (!idCliente) {
    return apiError("El identificador del cliente no es válido.", 400);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError("El cuerpo de la solicitud debe ser JSON válido.", 400);
  }

  const validation = validateClientePayload(payload, { partial: true });
  if (validation.error) {
    return apiError(validation.error, 400, validation.details ?? null);
  }

  try {
    const { data, error } = await supabase
      .from("cliente")
      .update(validation.data)
      .eq("idCliente", idCliente)
      .select("*")
      .maybeSingle();

    if (error?.code === "23505") {
      return apiError("Ya existe un cliente registrado con ese CUIT.", 409);
    }
    if (error) {
      return apiError("No se pudo actualizar el cliente", 500, error.message);
    }
    if (!data) {
      return apiError("No se encontró el cliente solicitado.", 404);
    }

    return apiSuccess(data, "Cliente actualizado correctamente");
  } catch (error) {
    return apiError("Error interno en el servidor", 500, error.message);
  }
}

export async function DELETE(_request, context) {
  const idCliente = await getClienteId(context);
  if (!idCliente) {
    return apiError("El identificador del cliente no es válido.", 400);
  }

  try {
    const { data, error } = await supabase
      .from("cliente")
      .delete()
      .eq("idCliente", idCliente)
      .select("idCliente")
      .maybeSingle();

    if (error?.code === "23503") {
      return apiError(
        "No se puede eliminar el cliente porque tiene pedidos asociados.",
        409
      );
    }
    if (error) {
      return apiError("No se pudo eliminar el cliente", 500, error.message);
    }
    if (!data) {
      return apiError("No se encontró el cliente solicitado.", 404);
    }

    return apiSuccess(data, "Cliente eliminado correctamente");
  } catch (error) {
    return apiError("Error interno en el servidor", 500, error.message);
  }
}
