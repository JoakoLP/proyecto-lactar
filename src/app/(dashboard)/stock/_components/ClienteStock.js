"use client";

import { useEffect, useState } from "react";
import { getStock } from "@/services/stock";
import TablaStock from "./TablaStock";

function calcularResumen(lotes) {
  return lotes.reduce((resumen, lote) => {
    const existente = resumen.find(
      (producto) => producto.nombre === lote.producto,
    );
    if (existente) {
      existente.kilos += lote.stockDisponible;
      existente.lotes += 1;
    } else {
      resumen.push({
        nombre: lote.producto,
        kilos: lote.stockDisponible,
        lotes: 1,
      });
    }
    return resumen;
  }, []);
}

export default function ClienteStock() {
  const [lotes, establecerLotes] = useState([]);
  const [cargando, establecerCargando] = useState(true);
  const [error, establecerError] = useState("");
  const [intento, establecerIntento] = useState(0);
  const [filtroProducto, establecerFiltroProducto] = useState("Todos");

  useEffect(() => {
    const controller = new AbortController();

    getStock({ signal: controller.signal })
      .then((lotes) => {
        if (!controller.signal.aborted) {
          establecerLotes(lotes);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          establecerError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          establecerCargando(false);
        }
      });

    return () => controller.abort();
  }, [intento]);

  const productos = [
    "Todos",
    ...new Set(lotes.map((lote) => lote.producto)),
  ];
  const lotesFiltrados = lotes.filter(
    (lote) => filtroProducto === "Todos" || lote.producto === filtroProducto,
  );
  const lotesConStock = lotesFiltrados.filter(
    (lote) => lote.stockDisponible > 0,
  );
  const resumen = calcularResumen(lotesConStock);
  const kilosTotales = lotesFiltrados.reduce(
    (total, lote) => total + lote.stockDisponible,
    0,
  );
  const cantidadLotes = lotesConStock.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-lactarDark">Stock y Lotes</h2>
          <p className="text-sm text-gray-500">
            Consultá el stock neto disponible y las reservas por lote.
          </p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          Stock actualizado
        </span>
      </header>

      {cargando ? (
        <p role="status" aria-live="polite" className="text-sm text-gray-600">
          Cargando stock...
        </p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p>No se pudo cargar el stock: {error}</p>
          <button
            type="button"
            onClick={() => {
              establecerCargando(true);
              establecerError("");
              establecerIntento((actual) => actual + 1);
            }}
            className="mt-3 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      ) : lotes.length === 0 ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600"
        >
          No hay lotes con stock para mostrar.
        </p>
      ) : (
        <>
          <section
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
            aria-label="Resumen del stock"
          >
            <Resumen
              titulo="Kilos disponibles"
              valor={`${kilosTotales.toLocaleString("es-AR")} kg`}
              color="text-green-700"
            />
            <Resumen
              titulo="Lotes disponibles"
              valor={cantidadLotes}
              color="text-blue-700"
            />
            <Resumen
              titulo="Productos en stock"
              valor={resumen.length}
              color="text-lactarDark"
            />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-blue-900">
                  Existencias por producto
                </h3>
                <p className="text-sm text-gray-500">
                  Los kilos reflejan el stock neto, luego de descontar las
                  reservas.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                Producto
                <select
                  value={filtroProducto}
                  onChange={(evento) =>
                    establecerFiltroProducto(evento.target.value)
                  }
                  className="rounded-lg border border-gray-300 p-2.5 font-normal text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {productos.map((producto) => (
                    <option key={producto}>{producto}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {resumen.length > 0 ? (
                resumen.map((producto) => (
                  <div
                    key={producto.nombre}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <p className="text-sm font-semibold text-gray-600">
                      {producto.nombre}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-lactarDark">
                      {producto.kilos.toLocaleString("es-AR")} kg
                    </p>
                    <p className="text-xs text-gray-500">
                      {producto.lotes}{" "}
                      {producto.lotes === 1 ? "lote" : "lotes"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">
                  No hay stock neto para el producto seleccionado.
                </p>
              )}
            </div>
          </section>

          <TablaStock lotes={lotesFiltrados} />
        </>
      )}
    </div>
  );
}

function Resumen({ titulo, valor, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">{titulo}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{valor}</p>
    </div>
  );
}
