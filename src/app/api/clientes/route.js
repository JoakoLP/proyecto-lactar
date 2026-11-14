import { supabase } from "@/services/supabase";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { validateClientePayload } from "@/utils/clienteValidation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("cliente")
      .select("*")
      .order("idCliente", { ascending: true });

    if (error) {
      return apiError("Error al consultar clientes", 500, error.message);
    }

    return apiSuccess(data, "Clientes obtenidos correctamente");
  } catch (error) {
    return apiError("Error interno en el servidor", 500, error.message);
  }
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return apiError("El cuerpo de la solicitud debe ser JSON válido.", 400);
  }

  const validation = validateClientePayload(payload);
  if (validation.error) {
    return apiError(validation.error, 400, validation.details ?? null);
  }

  try {
    const { data, error } = await supabase
      .from("cliente")
      .insert(validation.data)
      .select("*")
      .single();

    if (error?.code === "23505") {
      return apiError("Ya existe un cliente registrado con ese CUIT.", 409);
    }
    if (error) {
      return apiError("No se pudo crear el cliente", 500, error.message);
    }

    return apiSuccess(data, "Cliente registrado exitosamente", 201);
  } catch (error) {
    return apiError("Error interno en el servidor", 500, error.message);
  }
}
