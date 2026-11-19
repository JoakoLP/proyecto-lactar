async function requestUsuarios(path, options) {
  const response = await fetch(path, options);
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta inválida.");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.error || "No se pudo completar la operación.");
  }

  return result;
}

export async function getUsuarios({ signal } = {}) {
  const result = await requestUsuarios("/api/usuarios", { signal });
  return result.data ?? [];
}

export async function createUsuario(usuario) {
  const payload = {
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    nombreUsuario: usuario.nombreUsuario,
    email: usuario.email,
    password: usuario.password,
    rol: usuario.rol,
    activo: Boolean(usuario.activo),
  };

  const result = await requestUsuarios("/api/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return result.data;
}

export async function updateUsuario(idUsuario, usuario) {
  const payload = {
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    nombreUsuario: usuario.nombreUsuario,
    email: usuario.email,
    rol: usuario.rol,
    activo: Boolean(usuario.activo),
  };

  if (usuario.password && usuario.password.trim() !== "") {
    payload.password = usuario.password;
  }

  const result = await requestUsuarios(`/api/usuarios/${idUsuario}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return result.data;
}

export async function toggleEstadoUsuario(idUsuario, activo) {
  const result = await requestUsuarios(`/api/usuarios/${idUsuario}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activo: Boolean(activo) }),
  });

  return result.data;
}

export async function deleteUsuario(idUsuario) {
  const result = await requestUsuarios(`/api/usuarios/${idUsuario}`, {
    method: "DELETE",
  });

  return result.data;
}
