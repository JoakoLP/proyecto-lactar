"use client";

import { ESTADOS_LOTE } from "@/utils/produccionValidation";

const ESTILOS_ESTADO = {
  "En producción": "bg-purple-100 text-purple-800",
  "En maduración": "bg-yellow-100 text-yellow-800",
  Disponible: "bg-green-100 text-green-800",
  "Reservado parcial": "bg-blue-100 text-blue-800",
  "Reservado total": "bg-indigo-100 text-indigo-800",
  Agotado: "bg-gray-200 text-gray-800",
  Bloqueado: "bg-red-100 text-red-800",
  Cerrado: "bg-slate-200 text-slate-800",
};

const ESTADOS_GESTIONABLES = new Set([
  ESTADOS_LOTE.EN_PRODUCCION,
  ESTADOS_LOTE.EN_MADURACION,
  ESTADOS_LOTE.DISPONIBLE,
  ESTADOS_LOTE.BLOQUEADO,
]);

const ENCABEZADOS = [
  "Código",
  "Tina",
  "Inicio",
  "Fin",
  "Producto",
  "Operario",
  "Leche",
  "Queso",
  "Rinde",
  "Estado",
  "Acciones",
];

function formatearFechaHora(fechaIso) {
  if (!fechaIso) return "-";
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);
}

export default function TablaLotes({
  lotes,
  isLoading,
  alVerTrazabilidad,
  alGestionarLote,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-bold text-blue-900">Lotes registrados</h3>
        <p className="text-sm text-gray-600">
          El stock disponible se calcula a partir de los lotes en estado
          Disponible.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1160px] text-left text-sm">
          <caption className="sr-only">Listado de lotes de producción</caption>
          <thead className="border-b border-gray-200 bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              {ENCABEZADOS.map((encabezado) => (
                <th key={encabezado} scope="col" className="px-4 py-3">
                  {encabezado}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan={ENCABEZADOS.length}
                  className="px-4 py-8 text-center text-gray-600"
                >
                  Cargando lotes de producción...
                </td>
              </tr>
            ) : lotes.length === 0 ? (
              <tr>
                <td
                  colSpan={ENCABEZADOS.length}
                  className="px-4 py-8 text-center text-gray-600"
                >
                  No hay lotes de producción registrados.
                </td>
              </tr>
            ) : (
              lotes.map((lote) => (
                <FilaLote
                  key={lote.codigoLote}
                  lote={lote}
                  alVerTrazabilidad={alVerTrazabilidad}
                  alGestionarLote={alGestionarLote}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilaLote({ lote, alVerTrazabilidad, alGestionarLote }) {
  const estadoNombre = lote.estado_lote?.nombre ?? "Desconocido";
  const tinaId = lote.tina?.idTina ?? lote.idTina;
  const operario = lote.usuario
    ? `${lote.usuario.nombre} ${lote.usuario.apellido}`
    : "-";
  const litros = Number(lote.litrosLeche ?? 0);
  const kilosObtenidos = Number(lote.kilosObtenidos ?? 0);
  const kilosDisponibles = Number(lote.kilosDisponibles ?? 0);
  const rindeReal = Number(lote.rendimientoReal ?? 0);
  const rindeEsperado =
    lote.producto?.rendimientoEsperado !== null &&
    lote.producto?.rendimientoEsperado !== undefined
      ? Number(lote.producto.rendimientoEsperado)
      : null;

  const cumpleRinde =
    rindeReal > 0 && rindeEsperado !== null ? rindeReal >= rindeEsperado : null;
  const esGestionable = ESTADOS_GESTIONABLES.has(lote.idEstadoLote);

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-gray-900">
        {lote.codigoLote}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-800">
        {tinaId ? `Tina ${tinaId}` : "-"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
        {formatearFechaHora(lote.fechaInicio)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
        {formatearFechaHora(lote.fechaFin)}
      </td>
      <td className="px-4 py-3 font-medium text-gray-900">
        {lote.producto?.nombre ?? "-"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{operario}</td>
      <td className="whitespace-nowrap px-4 py-3 text-gray-800">
        {litros.toLocaleString("es-AR")} L
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="font-medium text-gray-900">
          {kilosObtenidos.toLocaleString("es-AR")} kg
        </span>
        {kilosObtenidos > 0 && (
          <span className="block text-xs text-gray-600">
            Disp: {kilosDisponibles.toLocaleString("es-AR")} kg
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {rindeReal > 0 ? (
          <div>
            <span
              className={`font-bold ${
                cumpleRinde === false ? "text-amber-700" : "text-green-700"
              }`}
            >
              {rindeReal.toFixed(2)}%
            </span>
            {rindeEsperado !== null && (
              <span
                className={`block text-xs font-medium ${
                  cumpleRinde ? "text-green-700" : "text-amber-700"
                }`}
              >
                Esp: {rindeEsperado.toFixed(2)}%{" "}
                {cumpleRinde ? "(En meta)" : "(Bajo meta)"}
              </span>
            )}
          </div>
        ) : (
          <span className="font-medium text-gray-500">Pendiente</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
            ESTILOS_ESTADO[estadoNombre] || "bg-gray-100 text-gray-800"
          }`}
        >
          {estadoNombre}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => alVerTrazabilidad(lote.codigoLote)}
            className="font-semibold text-gray-700 hover:text-blue-900 focus:outline-none focus:underline"
          >
            Trazabilidad
          </button>
          {esGestionable && (
            <button
              type="button"
              onClick={() => alGestionarLote(lote)}
              className="font-semibold text-blue-700 hover:text-blue-900 focus:outline-none focus:underline"
            >
              {lote.idEstadoLote === ESTADOS_LOTE.EN_PRODUCCION
                ? "Cerrar / Gestionar"
                : "Gestionar"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
