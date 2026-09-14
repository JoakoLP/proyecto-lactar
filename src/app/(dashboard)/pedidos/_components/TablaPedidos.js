const ESTILOS_ESTADO = {
  Pendiente: "bg-gray-100 text-gray-800",
  "En preparación": "bg-yellow-100 text-yellow-800",
  Preparado: "bg-blue-100 text-blue-800",
  Confirmado: "bg-green-100 text-green-800",
  Cancelado: "bg-red-100 text-red-800",
};

export default function TablaPedidos({
  pedidos,
  alSeleccionar,
  pedidoSeleccionado,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-bold text-blue-900">Pedidos registrados</h3>
        <p className="text-sm text-gray-500">
          Cada pedido reserva kilos hasta su confirmación o cancelación.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <caption className="sr-only">Listado de pedidos de venta</caption>
          <thead className="border-b border-gray-200 bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th scope="col" className="px-4 py-3">
                Pedido
              </th>
              <th scope="col" className="px-4 py-3">
                Fecha
              </th>
              <th scope="col" className="px-4 py-3">
                Cliente
              </th>
              <th scope="col" className="px-4 py-3">
                Total kg
              </th>
              <th scope="col" className="px-4 py-3">
                Estado
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 ">
            {pedidos.map((pedido) => {
              const kilos = pedido.detalles.reduce(
                (total, detalle) => total + detalle.kilos,
                0,
              );
              const seleccionado = pedido.idPedido === pedidoSeleccionado;
              return (
                <tr
                  key={pedido.idPedido}
                  className={seleccionado ? "bg-blue-50" : "hover:bg-gray-50"}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-gray-900">
                    #{pedido.idPedido}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {pedido.fecha}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {pedido.cliente}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {kilos.toLocaleString("es-AR")} kg
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold ${ESTILOS_ESTADO[pedido.estado]}`}
                    >
                      {pedido.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => alSeleccionar(pedido.idPedido)}
                      className="font-bold text-blue-700 underline-offset-2 hover:text-blue-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Ver detalle del pedido ${pedido.idPedido}`}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
