async function requestPedidos(path, options) {
    const response = await fetch(path, options);
    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error('El servidor devolvió una respuesta inválida.');
    }

    if (!result || typeof result !== 'object' || Array.isArray(result)) {
        throw new Error('El servidor devolvió una respuesta inválida.');
    }

    if (!response.ok || result.success !== true) {
        throw new Error(result.error || 'No se pudo completar la operación.');
    }
    if (!('data' in result)) {
        throw new Error('El servidor devolvió una respuesta inválida.');
    }

    return result.data;
}

export async function getPedidos({ signal } = {}) {
    const pedidos = await requestPedidos('/api/pedidos', { signal });
    if (!Array.isArray(pedidos)) {
        throw new Error('El servidor devolvió una lista de pedidos inválida.');
    }

    return pedidos;
}

export async function createPedido(pedido) {
    const creado = await requestPedidos('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido),
    });

    if (
        !creado ||
        typeof creado !== 'object' ||
        Array.isArray(creado) ||
        !Number.isInteger(creado.idPedido)
    ) {
        throw new Error('El servidor devolvió un pedido creado inválido.');
    }

    return creado;
}
