async function requestProductos(path, options) {
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
        throw new Error(result.error || 'No se pudieron consultar los productos.');
    }
    if (!Array.isArray(result.data)) {
        throw new Error('El servidor devolvió una lista de productos inválida.');
    }

    return result.data.map((producto) => {
        const precioKg = Number(producto.precioBase);
        if (
            !Number.isInteger(producto.idProducto) ||
            producto.idProducto <= 0 ||
            typeof producto.nombre !== 'string' ||
            !Number.isFinite(precioKg) ||
            precioKg < 0
        ) {
            throw new Error('El servidor devolvió un producto inválido.');
        }

        return {
            idProducto: producto.idProducto,
            nombre: producto.nombre,
            precioKg,
        };
    });
}

export async function getProductos({ signal } = {}) {
    return requestProductos('/api/productos', { signal });
}
