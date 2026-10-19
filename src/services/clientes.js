async function requestClientes(path, options) {
    const response = await fetch(path, options);
    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error('El servidor devolvió una respuesta inválida.');
    }

    if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo completar la operación.');
    }

    return result.data;
}

function mapCliente(cliente) {
    return {
        id: cliente.idCliente,
        razonSocial: cliente.razonSocial,
        cuit: cliente.cuit,
        telefono: cliente.telefono || '',
        domicilio: cliente.domicilio || '',
        email: cliente.email || '',
        saldo: Number(cliente.saldo),
        estado: Number(cliente.activo) === 1 ? 'Activo' : 'Inactivo',
    };
}

function toApiPayload(cliente) {
    return {
        razonSocial: cliente.razonSocial,
        cuit: cliente.cuit,
        telefono: cliente.telefono,
        domicilio: cliente.domicilio,
        email: cliente.email,
        activo: cliente.estado === 'Inactivo' ? 0 : 1,
    };
}

export async function getClientes({ signal } = {}) {
    const clientes = await requestClientes('/api/clientes', { signal });
    return clientes.map(mapCliente);
}

export async function createCliente(cliente) {
    const created = await requestClientes('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiPayload(cliente)),
    });

    return mapCliente(created);
}

export async function updateCliente(cliente) {
    const updated = await requestClientes(`/api/clientes/${cliente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiPayload(cliente)),
    });

    return mapCliente(updated);
}

export async function deleteCliente(idCliente) {
    return requestClientes(`/api/clientes/${idCliente}`, { method: 'DELETE' });
}
