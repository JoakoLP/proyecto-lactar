"use client";

const ESTILOS_ESTADO = {
  "En producción": "bg-purple-100 text-purple-800",
  "En maduración": "bg-yellow-100 text-yellow-800",
  Disponible: "bg-green-100 text-green-800",
};
const ENCABEZADOS = [
  "Código",
  "Tina",
  "Inicio",
  "Fin",
  "Producto",
  "Leche",
  "Queso",
  "Rinde",
  "Estado",
  "Acción",
];

export default function TablaLotes({ lotes, alCerrarLote }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-bold text-blue-900">Lotes registrados</h3>
        <p className="text-sm text-gray-500">
          El stock se calculará a partir de los lotes disponibles.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <caption className="sr-only">Listado de lotes de producción</caption>
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
              <FilaLote
                key={lote.codigoLote}
                lote={lote}
                alCerrarLote={alCerrarLote}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilaLote({ lote, alCerrarLote }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-gray-900">
        {lote.codigoLote}
      </td>
      <td className="px-4 py-3">{lote.tina || "-"}</td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
        {lote.fechaInicio}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
        {lote.fechaFin}
      </td>
      <td className="px-4 py-3 font-medium">{lote.producto}</td>
      <td className="px-4 py-3">
        {lote.litrosLeche.toLocaleString("es-AR")} L
      </td>
      <td className="px-4 py-3 font-medium">
        {lote.kilosObtenidos.toLocaleString("es-AR")} kg
      </td>
      <td
        className={`px-4 py-3 font-bold ${lote.rendimientoReal ? "text-green-600" : "text-gray-400"}`}
      >
        {lote.rendimientoReal ? `${lote.rendimientoReal}%` : "Pendiente"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold ${ESTILOS_ESTADO[lote.estado] || "bg-gray-100 text-gray-700"}`}
        >
          {lote.estado}
        </span>
      </td>
      <td className="px-4 py-3">
        {lote.estado === "En producción" && (
          <button
            type="button"
            onClick={() => alCerrarLote(lote.codigoLote)}
            className="font-semibold text-blue-700 hover:text-blue-900 focus:outline-none focus:underline"
          >
            Cerrar lote
          </button>
        )}
      </td>
    </tr>
  );
}
