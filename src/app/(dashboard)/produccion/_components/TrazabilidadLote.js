"use client";

import { useEffect, useState } from "react";
import { getLoteDetalle } from "@/services/produccion";

function formatearFechaHora(fechaIso) {
  if (!fechaIso) return "-";
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);
}

function formatearFechaCorta(fechaIso) {
  if (!fechaIso) return "-";
  const fecha = new Date(`${fechaIso}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return fechaIso;
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(fecha);
}

function TrazabilidadLoteContenido({ codigoLote, onClose }) {
  const [detalle, setDetalle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function cargarDetalle() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getLoteDetalle(codigoLote, {
          signal: controller.signal,
        });
        setDetalle(data);
      } catch (err) {
        if (err?.name !== "AbortError") {
          setError(
            err?.message || "No se pudo cargar la trazabilidad del lote.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    cargarDetalle();
    return () => controller.abort();
  }, [codigoLote]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const rindeReal = Number(detalle?.rendimientoReal ?? 0);
  const rindeEsperado =
    detalle?.producto?.rendimientoEsperado !== null &&
    detalle?.producto?.rendimientoEsperado !== undefined
      ? Number(detalle.producto.rendimientoEsperado)
      : null;
  const asignaciones = detalle?.asignacion_lote ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-trazabilidad-titulo"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <h2
              id="modal-trazabilidad-titulo"
              className="text-lg font-bold text-blue-900"
            >
              Trazabilidad del Lote{" "}
              <span className="font-mono">{codigoLote}</span>
            </h2>
            {detalle?.estado_lote?.nombre && (
              <p className="text-xs font-semibold text-gray-600">
                Estado actual: {detalle.estado_lote.nombre}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Cerrar modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-gray-600" role="status">
              Cargando detalle y trazabilidad del lote...
            </p>
          ) : error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {error}
            </div>
          ) : detalle ? (
            <>
              <dl className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm sm:grid-cols-2">
                <DatoDetalle
                  label="Producto"
                  valor={detalle.producto?.nombre ?? "-"}
                />
                <DatoDetalle
                  label="Tina utilizada"
                  valor={
                    detalle.tina?.idTina
                      ? `Tina ${detalle.tina.idTina} (Máx. ${Number(detalle.tina.capacidadLitros).toLocaleString("es-AR")} L)`
                      : "-"
                  }
                />
                <DatoDetalle
                  label="Operario responsable"
                  valor={
                    detalle.usuario
                      ? `${detalle.usuario.nombre} ${detalle.usuario.apellido}`
                      : "-"
                  }
                />
                <DatoDetalle
                  label="Tiempo de maduración"
                  valor={
                    detalle.producto?.tiempoMaduracion !== undefined &&
                    detalle.producto?.tiempoMaduracion !== null
                      ? `${detalle.producto.tiempoMaduracion} días`
                      : "-"
                  }
                />
                <DatoDetalle
                  label="Fecha de inicio"
                  valor={formatearFechaHora(detalle.fechaInicio)}
                />
                <DatoDetalle
                  label="Fecha de fin / cierre"
                  valor={formatearFechaHora(detalle.fechaFin)}
                />
                <DatoDetalle
                  label="Litros de leche ingresados"
                  valor={`${Number(detalle.litrosLeche).toLocaleString("es-AR")} L`}
                />
                <DatoDetalle
                  label="Kilos obtenidos / disponibles"
                  valor={`${Number(detalle.kilosObtenidos ?? 0).toLocaleString("es-AR")} kg obtenidos · ${Number(detalle.kilosDisponibles ?? 0).toLocaleString("es-AR")} kg disponibles`}
                />
                <DatoDetalle
                  label="Rinde real vs. esperado"
                  valor={
                    rindeReal > 0
                      ? `${rindeReal.toFixed(2)}%${rindeEsperado !== null ? ` (Esperado: ${rindeEsperado.toFixed(2)}%)` : ""}`
                      : `Pendiente${rindeEsperado !== null ? ` (Esperado: ${rindeEsperado.toFixed(2)}%)` : ""}`
                  }
                />
                <DatoDetalle
                  label="Observaciones"
                  valor={detalle.observaciones || "Sin observaciones"}
                />
              </dl>

              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-900">
                  Trazabilidad comercial (Pedidos asignados)
                </h3>
                {asignaciones.length === 0 ? (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Este lote aún no tiene reservas ni asignaciones en pedidos.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-gray-200 bg-gray-100 text-xs uppercase text-gray-700">
                        <tr>
                          <th scope="col" className="px-4 py-2.5">
                            Pedido
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            Ítem
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            Fecha
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            Cliente
                          </th>
                          <th scope="col" className="px-4 py-2.5">
                            Kilos asignados
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {asignaciones.map((asig) => (
                          <tr key={asig.idAsignacion} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-mono font-semibold text-gray-900">
                              #{asig.idPedido}
                            </td>
                            <td className="px-4 py-2.5 text-gray-700">
                              {asig.nroItem}
                            </td>
                            <td className="px-4 py-2.5 text-gray-700">
                              {formatearFechaCorta(asig.pedido?.fecha)}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-gray-900">
                              {asig.pedido?.cliente?.razonSocial ?? "-"}
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-blue-900">
                              {Number(asig.kilosAsignados).toLocaleString(
                                "es-AR",
                              )}{" "}
                              kg
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}

          <div className="flex justify-end border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatoDetalle({ label, valor }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-gray-900">{valor}</dd>
    </div>
  );
}

export default function TrazabilidadLote({ isOpen, codigoLote, onClose }) {
  if (!isOpen || !codigoLote) return null;
  return (
    <TrazabilidadLoteContenido
      key={codigoLote}
      codigoLote={codigoLote}
      onClose={onClose}
    />
  );
}
