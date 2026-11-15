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

export async function cambiarEstadoPedido(idPedido, estado) {
    const actualizado = await requestPedidos(`/api/pedidos/${idPedido}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
    });

    if (
        !actualizado ||
        typeof actualizado !== 'object' ||
        Array.isArray(actualizado) ||
        actualizado.idPedido !== idPedido ||
        actualizado.estado !== estado
    ) {
        throw new Error('El servidor devolvió un estado de pedido inválido.');
    }

    return actualizado;
}

export async function confirmarVentaPedido(idPedido) {
    const venta = await requestPedidos(`/api/pedidos/${idPedido}/confirmar`, {
        method: 'POST',
    });

    if (
        !venta ||
        typeof venta !== 'object' ||
        Array.isArray(venta) ||
        venta.idPedido !== idPedido ||
        !Number.isInteger(venta.idVenta) ||
        typeof venta.numeroFactura !== 'string' ||
        !Number.isFinite(Number(venta.total)) ||
        typeof venta.fechaVenta !== 'string'
    ) {
        throw new Error('El servidor devolvió una venta confirmada inválida.');
    }

    return venta;
}
