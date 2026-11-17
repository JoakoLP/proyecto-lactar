async function requestStock(path, options) {
    const response = await fetch(path, options);
    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error('El servidor devolvió una respuesta inválida.');
    }

    if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo consultar el stock.');
    }

    return result.data;
}

export async function getStock({ signal } = {}) {
    return requestStock('/api/stock', { signal });
}
