async function requestProduccion(path, options) {
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

export async function getTinas({ signal } = {}) {
    const tinas = await requestProduccion('/api/tinas', { signal });
    if (!Array.isArray(tinas)) {
        throw new Error('El servidor devolvió una lista de tinas inválida.');
    }

    return tinas;
}

export async function getProducciones({ signal } = {}) {
    const producciones = await requestProduccion('/api/produccion', { signal });
    if (!Array.isArray(producciones)) {
        throw new Error('El servidor devolvió una lista de producciones inválida.');
    }

    return producciones;
}

export async function createProduccion(produccion) {
    const creado = await requestProduccion('/api/produccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produccion),
    });

    if (
        !creado ||
        typeof creado !== 'object' ||
        Array.isArray(creado) ||
        typeof creado.codigoLote !== 'string'
    ) {
        throw new Error('El servidor devolvió un lote de producción creado inválido.');
    }

    return creado;
}

export async function getLotes({ signal } = {}) {
    const lotes = await requestProduccion('/api/lotes', { signal });
    if (!Array.isArray(lotes)) {
        throw new Error('El servidor devolvió una lista de lotes inválida.');
    }

    return lotes;
}

export async function getLoteDetalle(codigoLote, { signal } = {}) {
    const lote = await requestProduccion(
        `/api/lotes/${encodeURIComponent(codigoLote)}`,
        { signal },
    );

    if (
        !lote ||
        typeof lote !== 'object' ||
        Array.isArray(lote) ||
        typeof lote.codigoLote !== 'string'
    ) {
        throw new Error('El servidor devolvió un detalle de lote inválido.');
    }

    return lote;
}

export async function actualizarLote(codigoLote, payload) {
    const actualizado = await requestProduccion(
        `/api/lotes/${encodeURIComponent(codigoLote)}`,
        {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        },
    );

    if (
        !actualizado ||
        typeof actualizado !== 'object' ||
        Array.isArray(actualizado) ||
        typeof actualizado.codigoLote !== 'string'
    ) {
        throw new Error('El servidor devolvió un lote actualizado inválido.');
    }

    return actualizado;
}
