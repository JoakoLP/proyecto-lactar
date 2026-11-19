export async function getReportes({ dias = "30", signal } = {}) {
  const params = new URLSearchParams({ dias: String(dias) });
  const response = await fetch(`/api/reportes?${params.toString()}`, { signal });

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta inválida.");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.error || "No se pudieron cargar los reportes.");
  }

  return result.data;
}
