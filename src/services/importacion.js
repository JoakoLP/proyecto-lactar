export async function importarArchivo({ entidad, file }) {
  const formData = new FormData();
  formData.append("entidad", entidad);
  formData.append("file", file);

  const response = await fetch("/api/importar", {
    method: "POST",
    body: formData,
  });

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta inválida.");
  }

  if (!response.ok || !result.success) {
    const err = new Error(result.error || "No se pudo completar la importación.");
    err.details = result.details ?? null;
    throw err;
  }

  return {
    message: result.message,
    data: result.data,
  };
}
