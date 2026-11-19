async function requestAuth(path, options) {
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

  return result.data;
}

export async function loginUsuario({ identificador, password, rememberMe = false }) {
  return requestAuth("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identificador, password, rememberMe }),
  });
}

export async function logoutUsuario() {
  return requestAuth("/api/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser({ signal } = {}) {
  return requestAuth("/api/auth/me", { signal });
}
