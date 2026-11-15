async function requestVentas(path, options) {
    const response = await fetch(path, options);
    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error('El servidor devolvió una respuesta inválida.');
    }

    if (
        !result ||
        typeof result !== 'object' ||
        Array.isArray(result) ||
        !response.ok ||
        result.success !== true ||
        !('data' in result)
    ) {
        throw new Error(result?.error || 'No se pudieron consultar las ventas.');
    }

    return result.data;
}

export async function getVentas({ signal } = {}) {
    const ventas = await requestVentas('/api/ventas', { signal });
    if (!Array.isArray(ventas)) {
        throw new Error('El servidor devolvió una lista de ventas inválida.');
    }

    return ventas;
}
