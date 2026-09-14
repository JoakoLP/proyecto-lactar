const CLASE_ENTRADA =
  "mt-1 block w-full rounded-lg border border-gray-300 p-2.5 font-normal text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500";

export default function FormularioPedido({
  clientes,
  productos,
  formulario,
  detalles,
  total,
  error,
  aviso,
  alCambiar,
  alAgregarDetalle,
  alQuitarDetalle,
  alEnviar,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 border-b border-gray-200 pb-3">
        <h3 className="text-lg font-bold text-blue-900">Cargar nuevo pedido</h3>
        <p className="text-sm text-gray-500">
          Ingresá cantidades en kilos. El sistema valida y reserva el stock
          automáticamente.
        </p>
      </div>
      <form onSubmit={alEnviar} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Campo etiqueta="Cliente" id="cliente">
            <select
              id="cliente"
              name="cliente"
              value={formulario.cliente}
              onChange={alCambiar}
              className={CLASE_ENTRADA}
              required
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente}>{cliente}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Observaciones" id="observacionesPedido">
            <input
              id="observacionesPedido"
              name="observaciones"
              value={formulario.observaciones}
              onChange={alCambiar}
              maxLength="200"
              placeholder="Opcional"
              className={CLASE_ENTRADA}
            />
          </Campo>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 font-bold text-gray-800">Productos del pedido</h4>
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_180px_auto]">
            <Campo etiqueta="Producto" id="productoPedido">
              <select
                id="productoPedido"
                name="producto"
                value={formulario.producto}
                onChange={alCambiar}
                className={CLASE_ENTRADA}
              >
                {productos.map((producto) => (
                  <option key={producto.nombre} value={producto.nombre}>
                    {producto.nombre} - $
                    {producto.precioKg.toLocaleString("es-AR")}/kg
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Cantidad" id="kilosPedido">
              <input
                id="kilosPedido"
                name="kilos"
                type="number"
                placeholder="kg"
                min="0.01"
                step="0.01"
                value={formulario.kilos}
                onChange={alCambiar}
                className={CLASE_ENTRADA}
                required
              />
            </Campo>
            <button
              type="button"
              onClick={alAgregarDetalle}
              className="rounded-lg bg-blue-100 px-4 py-2.5 font-bold text-blue-800 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Agregar producto
            </button>
          </div>
          {detalles.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <caption className="sr-only">
                  Productos agregados al pedido
                </caption>
                <thead className="border-b border-gray-300 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-3 py-2">Producto</th>
                    <th className="px-3 py-2">Kilos</th>
                    <th className="px-3 py-2">Subtotal</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-slate-900">
                  {detalles.map((detalle, indice) => (
                    <tr key={`${detalle.producto}-${indice}`}>
                      <td className="px-3 py-2 font-medium">
                        {detalle.producto}
                      </td>
                      <td className="px-3 py-2">
                        {detalle.kilos.toLocaleString("es-AR")} kg
                      </td>
                      <td className="px-3 py-2">
                        $
                        {(detalle.kilos * detalle.precioKg).toLocaleString(
                          "es-AR",
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => alQuitarDetalle(indice)}
                          className="font-bold text-red-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex flex-col items-start justify-between gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center">
          <p className="text-lg font-bold text-gray-800">
            Total:{" "}
            <span className="text-lactarDark">
              ${total.toLocaleString("es-AR")}
            </span>
          </p>
          <button
            type="submit"
            className="rounded-lg bg-lactarBlue px-5 py-2.5 font-bold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Guardar y reservar kilos
          </button>
        </div>
      </form>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}
      {aviso && (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700"
        >
          {aviso}
        </p>
      )}
    </section>
  );
}

function Campo({ etiqueta, id, children }) {
  return (
    <label htmlFor={id} className="block text-sm font-bold text-gray-800">
      {etiqueta}
      {children}
    </label>
  );
}
