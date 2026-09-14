const ENCABEZADOS = [
  "Código de lote",
  "Producto",
  "Finalización",
  "Kilos obtenidos",
  "Kilos disponibles",
  "Estado",
];

export default function TablaStock({ lotes }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-bold text-blue-900">
          Detalle de lotes disponibles
        </h3>
        <p className="text-sm text-gray-500">
          El stock disponible se calcula con los kilos restantes de cada lote.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <caption className="sr-only">
            Detalle del stock por lote disponible
          </caption>
          <thead className="border-b border-gray-200 bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              {ENCABEZADOS.map((encabezado) => (
                <th key={encabezado} scope="col" className="px-4 py-3">
                  {encabezado}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {lotes.map((lote) => (
              <tr key={lote.codigoLote} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-slate-900">
                  {lote.codigoLote}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {lote.producto}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {lote.fechaFin}
                </td>
                <td className="px-4 py-3 text-slate-900">
                  {lote.kilosObtenidos.toLocaleString("es-AR")} kg
                </td>
                <td className="px-4 py-3 font-bold text-slate-900">
                  {lote.kilosDisponibles.toLocaleString("es-AR")} kg
                </td>
                <td className="px-4 py-3">
                  <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                    {lote.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
